# TODO: reorganize this so it's more obvious which actions are for
# students, teachers, and admins (most likely move into more relevant
# controllers)

class ReportsController < ApplicationController
  before_filter :authenticate_user!, except: [:header_stats, :user_progress]

  check_authorization except: [:header_stats, :user_progress, :students]

  before_action :set_script
  include LevelSourceHintsHelper
  include LevelsHelper

  def user_stats
    @user = User.find(params[:user_id])
    authorize! :read, @user

    #@recent_activity = Activity.where(['user_id = ?', user.id]).order('id desc').includes({level: :game}).limit(2)
    @recent_levels = UserLevel.find_by_sql(<<SQL)
select ul.*, sl.game_chapter, l.game_id, sl.chapter, sl.script_id, sl.id as script_level_id
from user_levels ul
inner join script_levels sl on sl.level_id = ul.level_id
inner join levels l on l.id = ul.level_id
where sl.script_id = 1 and ul.user_id = #{@user.id}
order by ul.updated_at desc limit 2
SQL
  end

  def header_stats
    script_name = params[:script_name]
    script_id = params[:script_id]

    if script_name
      @script = Script.find_by_name(script_name)
    elsif script_id
      @script = Script.find(script_id)
    end
    raise ActiveRecord::RecordNotFound unless @script

    render file: 'shared/_user_stats', layout: false, locals: { user: current_user }
  end

  def user_progress
    script_name = params[:script_name]
    stage_id = params[:stage_id]
    level_id = params[:level_id]
    raise ActiveRecord::RecordNotFound unless script_name && level_id

    script = Script.find_by_name(script_name)
    raise ActiveRecord::RecordNotFound unless script

    if script.default_script?
      script_level = script.get_script_level_by_chapter(level_id)
    else
      script_level = script.get_script_level_by_stage_and_position(stage_id, level_id)
    end
    raise ActiveRecord::RecordNotFound unless script_level

    # Add in the user's current progress
    stage = script_level.stage
    level = script_level.level
    game = script_level.level.game

    # TODO:  Do we really need to check all these options?
    # Why are we looking at the user's "game" etc to show a script map?
    game_levels =
      if current_user
        current_user.levels_from_script(script, game.id, stage)
      elsif stage
        script.script_levels.to_a.select{|sl| sl.stage_id == script_level.stage_id}
      else
        script.script_levels.to_a.select{|sl| sl.level.game_id == script_level.level.game_id}
      end

    stage_data = {
      title: stage_title(script, script_level.stage_or_game),
      levels: game_levels.map do |sl|
        {
          id: sl.level.id,
          label: sl.level_display_text,
          link: build_script_level_path(sl),
          unplugged: !!sl.level.unplugged?,
          assessment: !!sl.assessment
        }
      end
    }

    if script.hoc?
      stage_data[:finishLink] = {
        text: t('nav.header.finished_hoc'),
        href: hoc_finish_url(script)
      }
    end

    # USER-SPECIFIC DATA
    if current_user
      user_data = {
        linesOfCode: current_user.total_lines,
        linesOfCodeText: t('nav.popup.lines', lines: current_user.total_lines),
        status: {}
      }
      game_levels.map do |sl|
        completion_status, link = level_info(current_user, sl)
        user_data[:status][sl.level.id] = completion_status unless completion_status == 'not_tried'
      end

      if script.trophies
        progress = current_user.progress(script)
        user_data[:trophies] = {
          current: progress['current_trophies'],
          of: t(:of),
          max: progress['max_trophies']
        }
      end

    end

    # Prepare some globals for blockly_options()
    @script = script
    @level = level
    @game = game
    @script_level = script_level
    @current_user = current_user
    @callback = milestone_url(user_id: current_user.try(:id) || 0, script_level_id: script_level)
    @fallback_response = {
      success: milestone_response(script_level: script_level, solved?: true),
      failure: milestone_response(script_level: script_level, solved?: false)
    }
    @level_source_id = level.ideal_level_source_id
    set_videos_and_blocks_and_callouts_and_instructions  # @callouts, @autoplay_video_info

    # TODO: @phone_share_url

    if level.unplugged?
      # TODO: what does an unplugged level need?  'levels/unplug', locals: {app: @game.app}
      level_data = {}
    elsif level.is_a?(Blockly) && level.embed == 'true' && !@edit_blocks
      level_data = blockly_options({ embed: true, hide_source: true, no_padding: true, show_finish: true })
    elsif level.is_a?(DSLDefined)
      # TODO: partial "levels/#{level.class.to_s.underscore}"
      # TODO: What do I need to create 'levels/reference_area' ?
      level_data = {}
    else
      level_data = blockly_options()
    end
    level_data[:scriptPath] = build_script_level_path(script_level)
    level_data[:locale] = js_locale

    render json: {
      script: {
        id: script.id,
        stages: script.stages.to_a.count,
        trophies: !!script.trophies
      },
      stage: stage_data,
      level: level_data,
      progress: user_data
    }
  end






  def prizes
    authorize! :read, current_user
  end

  def usage
    @user = User.find(params[:user_id])
    authorize! :read, @user

    @recent_activities = get_base_usage_activity.where(['user_id = ?', @user.id])
  end

  def all_usage
    authorize! :read, :reports

    @recent_activities = get_base_usage_activity
    render 'usage', formats: [:html]
  end

  def admin_stats
    authorize! :read, :reports
    
    SeamlessDatabasePool.use_persistent_read_connection do
      @user_count = User.count
      @teacher_count = User.where(:user_type => 'teacher').count
      @student_count = @user_count - @teacher_count
      @users_with_teachers = Follower.distinct.count(:student_user_id)
      @users_with_email = User.where('email <> ""').count
      @users_with_confirmed_email = User.where('confirmed_at IS NOT NULL').count
      @girls = User.where(:gender => 'f').count
      @boys = User.where(:gender => 'm').count
 
      @prizes_redeemed = Prize.where('user_id IS NOT NULL').group(:prize_provider).count
      @prizes_available = Prize.where('user_id IS NULL').group(:prize_provider).count
      
      @student_prizes_earned = User.where(:prize_earned => true).count
      @student_prizes_redeemed = Prize.where('user_id IS NOT NULL').count
      @student_prizes_available = Prize.where('user_id IS NULL').count

      @teacher_prizes_earned = User.where(:teacher_prize_earned => true).count
      @teacher_prizes_redeemed = TeacherPrize.where('user_id IS NOT NULL').count
      @teacher_prizes_available = TeacherPrize.where('user_id IS NULL').count
      
      @teacher_bonus_prizes_earned = User.where(:teacher_bonus_prize_earned => true).count
      @teacher_bonus_prizes_redeemed = TeacherBonusPrize.where('user_id IS NOT NULL').count
      @teacher_bonus_prizes_available = TeacherBonusPrize.where('user_id IS NULL').count
    end
  end

  def admin_progress
    authorize! :read, :reports
    
    SeamlessDatabasePool.use_persistent_read_connection do
      @user_count = User.count
      @all_script_levels = Script.twenty_hour_script.script_levels.includes({ level: :game })
 
      @levels_attempted = User.joins(:user_levels).group(:level_id).where('best_result > 0').count
      @levels_attempted.default = 0
      @levels_passed = User.joins(:user_levels).group(:level_id).where('best_result >= 20').count
      @levels_passed.default = 0

      @stage_map = @all_script_levels.group_by { |sl| sl.level.game }
    end
  end

  def admin_concepts
    authorize! :read, :reports
    SeamlessDatabasePool.use_persistent_read_connection do
      render 'admin_concepts', formats: [:html]
    end
  end

  def students
    redirect_to teacher_dashboard_url
  end

  def level_stats
    authorize! :read, :reports

    @level = Level.find(params[:level_id])

    best_code_map = Hash.new{|h,k| h[k] = {:level_source_id => k, :count => 0, :popular => false} }
    passing_code_map = Hash.new{|h,k| h[k] = {:level_source_id => k, :count => 0, :popular => false} }
    finished_code_map = Hash.new{|h,k| h[k] = {:level_source_id => k, :count => 0, :popular => false} }
    unsuccessful_code_map = Hash.new{|h,k| h[k] = {:level_source_id => k, :count => 0, :popular => false} }
    all_but_best_code_map = Hash.new{|h,k| h[k] = {:level_source_id => k, :count => 0, :popular => false} }

    Activity.all.where(['level_id = ?', @level.id]).order('id desc').limit(10000).each do |activity|
      # Do not process activity records with nil level_source_id
      if activity.level_source_id.nil?
        next
      end
      if activity.best?
        best_code_map[activity.level_source_id][:count] += 1
      elsif activity.passing?
        passing_code_map[activity.level_source_id][:count] += 1
      elsif activity.finished?
        finished_code_map[activity.level_source_id][:count] += 1
      else
        unsuccessful_code_map[activity.level_source_id][:count] += 1
      end

      if !activity.best?
        all_but_best_code_map[activity.level_source_id][:count] += 1
      end
    end

    # Setting up the popular incorrect code
    if !all_but_best_code_map.empty?
      sorted_all_but_best_code = all_but_best_code_map.values.sort_by {|v| -v[:count] }
      pop_level_source_ids = Array.new([sorted_all_but_best_code.length - 1, 9].min)
      for idx in 0..[sorted_all_but_best_code.length - 1, 9].min
        pop_level_source_id = sorted_all_but_best_code[idx][:level_source_id]
        pop_level_source_ids[idx] = pop_level_source_id
        if passing_code_map.has_key?(pop_level_source_id)
          passing_code_map[pop_level_source_id][:popular] = true
          passing_code_map[pop_level_source_id][:pop_level_source_idx] = idx
        elsif finished_code_map.has_key?(pop_level_source_id)
          finished_code_map[pop_level_source_id][:popular] = true
          finished_code_map[pop_level_source_id][:pop_level_source_idx] = idx
        elsif unsuccessful_code_map.has_key?(pop_level_source_id)
          unsuccessful_code_map[pop_level_source_id][:popular] = true
          unsuccessful_code_map[pop_level_source_id][:pop_level_source_idx] = idx
        end
      end
    end

    @best_code = best_code_map.values.sort_by {|v| -v[:count] }
    @passing_code = passing_code_map.values.sort_by {|v| -v[:count] }
    @finished_code = finished_code_map.values.sort_by {|v| -v[:count] }
    @unsuccessful_code = unsuccessful_code_map.values.sort_by {|v| -v[:count] }
    @pop_level_source_ids = pop_level_source_ids

  end

  def assume_identity_form
    authorize! :manage, :all
  end

  def assume_identity
    authorize! :manage, :all

    user = User.where(:id => params[:user_id]).first
    user ||= User.where(:username => params[:user_id]).first
    user ||= User.find_by_email_or_hashed_email params[:user_id]

    if user
      sign_in user, :bypass => true
      redirect_to '/'
    else
      flash[:alert] = 'User not found'
      render :assume_identity_form
    end
  end

  def lookup_section
    authorize! :manage, :all
    @section = Section.find_by_code params[:section_code]
    if params[:section_code] && @section.nil?
      flash[:alert] = 'Section code not found'
    end
  end

  def level_completions
    authorize! :read, :reports
    require 'date'
# noinspection RubyResolve
    require '../dashboard/scripts/archive/ga_client/ga_client'

    @start_date = (params[:start_date] ? DateTime.parse(params[:start_date]) : (DateTime.now - 7)).strftime('%Y-%m-%d')
    @end_date = (params[:end_date] ? DateTime.parse(params[:end_date]) : DateTime.now.prev_day).strftime('%Y-%m-%d')

    output_data = {}
    %w(Attempt Success).each do |key|
      dimension = 'ga:eventLabel'
      metric = 'ga:totalEvents,ga:uniqueEvents,ga:avgEventValue'
      filter = "ga:eventAction==#{key};ga:eventCategory==Puzzle"
      if params[:filter]
        filter += ";ga:eventLabel=@#{params[:filter].to_s.gsub('_','/')}"
      end
      ga_data = GAClient.query_ga(@start_date, @end_date, dimension, metric, filter)
      if ga_data.data.containsSampledData
        throw new ArgumentError 'Google Analytics response contains sampled data, aborting.'
      end

      ga_data.data.rows.each do |r|
        label = r[0]
        output_data[label] ||= {}
        output_data[label]["Total#{key}"] = r[1]
        output_data[label]["Unique#{key}"] = r[2]
        output_data[label]["Avg#{key}"] = r[3]
      end
    end
    output_data.each_key do |key|
      output_data[key]['Avg Success Rate'] = output_data[key].delete('AvgAttempt')
      output_data[key]['Avg attempts per completion'] = output_data[key].delete('AvgSuccess')
      output_data[key]['Avg Unique Success Rate'] = output_data[key]['UniqueSuccess'].to_f / output_data[key]['UniqueAttempt'].to_f
    end

    @data_array = output_data.map do |key, value|
      {'Puzzle' => key}.merge(value)
    end
    require 'naturally'
    @data_array = @data_array.select{|x| x['TotalAttempt'].to_i > 10}.sort_by{|i| Naturally.normalize(i.send(:fetch, 'Puzzle'))}
  end

  private
  def get_base_usage_activity
    Activity.all.order('id desc').includes([:user, :level_source, {level: :game}]).limit(50)
  end

  # Use callbacks to share common setup or constraints between actions.
  def set_script
    @script = Script.find(params[:script_id]) if params[:script_id]
  end
end
