Feature: Complete a simple maze level

  Background:
    Given I am on "http://learn.code.org/reset_session"
    Given I am on "http://learn.code.org/s/20-hour/stage/2/puzzle/11?noautoplay=true"
    And I rotate to landscape
    And I wait for 2 seconds
    Then element ".dialog-title" has text "Puzzle 11 of 20"
    And element ".modal-content p:nth-child(2)" has text "Ok, one last time for practice - can you solve this one using only 4 blocks?"
    And element "#prompt" has text "Ok, one last time for practice - can you solve this one using only 4 blocks?"

  # This builds an uncommon program to avoid getting a crowdsourced hint.
  @no_mobile
  Scenario: Submit an incorrect program missing a block
    And I close the dialog
    Then element "#runButton" is visible
    And element "#resetButton" is hidden
    # Repeat: move forward, turn right, turn right
    Then I drag block "4" to block "5"
    And I drag block "3" into first position in repeat block "6"
    And I drag block "1" to block "7"
    And I drag block "1" to block "8"
    And I press "runButton"
    And I wait until element ".congrats" is visible
    Then element "#runButton" is hidden
    And element "#resetButton" is visible
    And element ".congrats" has text "Try one or more of the blocks below to solve this puzzle."
    # Checking for iframe with feedback blocks.
    And element ".modal-content div:nth-child(2) iframe:nth-child(1)" is visible
    And element ".modal-content div:nth-child(2) iframe:nth-child(1)" has id "feedbackBlocks"
    Then I press "again-button"
    And I press "resetButton"
    Then element "#runButton" is visible
    And element "#resetButton" is hidden

  Scenario: Submit a program with an empty repeat
    When I close the dialog
    Then element "#runButton" is visible
    And element "#resetButton" is hidden
    # Drag out repeat block.
    Then I drag block "4" to block "5"
    And I press "runButton"
    And I wait until element ".congrats" is visible
    Then element "#runButton" is hidden
    And element "#resetButton" is visible
    And element ".congrats" has text "The \"Repeat\" or \"If\" block needs to have other blocks inside it to work. Make sure the inner block fits properly inside the containing block."
    Then I press "again-button"
    And I press "resetButton"
    Then element "#runButton" is visible
    And element "#resetButton" is hidden

  Scenario: Submit a working program that uses too many blocks
    When I close the dialog
    Then element "#runButton" is visible
    And element "#resetButton" is hidden
    # move forward, Repeat: move forward, turn left, move forward
    Then I drag block "1" to block "5"
    And I drag block "4" to block "6"
    And I drag block "1" into first position in repeat block "7"
    And I drag block "2" to block "8"
    And I drag block "1" to block "9"
    And I press "runButton"
    And I wait until element ".congrats" is visible
    And element ".congrats" has text "Congratulations! You completed Puzzle 11. (However, you could have used only 5 blocks.)"
    Then I press "again-button"
    And I press "resetButton"
    Then element "#runButton" is visible
    And element "#resetButton" is hidden
