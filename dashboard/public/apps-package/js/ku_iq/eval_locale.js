var eval_locale = {lc:{"ar":function(n){
  if (n === 0) {
    return 'zero';
  }
  if (n == 1) {
    return 'one';
  }
  if (n == 2) {
    return 'two';
  }
  if ((n % 100) >= 3 && (n % 100) <= 10 && n == Math.floor(n)) {
    return 'few';
  }
  if ((n % 100) >= 11 && (n % 100) <= 99 && n == Math.floor(n)) {
    return 'many';
  }
  return 'other';
},"en":function(n){return n===1?"one":"other"},"bg":function(n){return n===1?"one":"other"},"bn":function(n){return n===1?"one":"other"},"ca":function(n){return n===1?"one":"other"},"cs":function(n){
  if (n == 1) {
    return 'one';
  }
  if (n == 2 || n == 3 || n == 4) {
    return 'few';
  }
  return 'other';
},"da":function(n){return n===1?"one":"other"},"de":function(n){return n===1?"one":"other"},"el":function(n){return n===1?"one":"other"},"es":function(n){return n===1?"one":"other"},"et":function(n){return n===1?"one":"other"},"eu":function(n){return n===1?"one":"other"},"fa":function(n){return "other"},"fi":function(n){return n===1?"one":"other"},"fil":function(n){return n===0||n==1?"one":"other"},"fr":function(n){return Math.floor(n)===0||Math.floor(n)==1?"one":"other"},"gl":function(n){return n===1?"one":"other"},"he":function(n){return n===1?"one":"other"},"hi":function(n){return n===0||n==1?"one":"other"},"hr":function(n){
  if ((n % 10) == 1 && (n % 100) != 11) {
    return 'one';
  }
  if ((n % 10) >= 2 && (n % 10) <= 4 &&
      ((n % 100) < 12 || (n % 100) > 14) && n == Math.floor(n)) {
    return 'few';
  }
  if ((n % 10) === 0 || ((n % 10) >= 5 && (n % 10) <= 9) ||
      ((n % 100) >= 11 && (n % 100) <= 14) && n == Math.floor(n)) {
    return 'many';
  }
  return 'other';
},"hu":function(n){return "other"},"id":function(n){return "other"},"is":function(n){
    return ((n%10) === 1 && (n%100) !== 11) ? 'one' : 'other';
  },"it":function(n){return n===1?"one":"other"},"ja":function(n){return "other"},"ko":function(n){return "other"},"lt":function(n){
  if ((n % 10) == 1 && ((n % 100) < 11 || (n % 100) > 19)) {
    return 'one';
  }
  if ((n % 10) >= 2 && (n % 10) <= 9 &&
      ((n % 100) < 11 || (n % 100) > 19) && n == Math.floor(n)) {
    return 'few';
  }
  return 'other';
},"lv":function(n){
  if (n === 0) {
    return 'zero';
  }
  if ((n % 10) == 1 && (n % 100) != 11) {
    return 'one';
  }
  return 'other';
},"mk":function(n){return (n%10)==1&&n!=11?"one":"other"},"mr":function(n){return n===1?"one":"other"},"ms":function(n){return "other"},"mt":function(n){
  if (n == 1) {
    return 'one';
  }
  if (n === 0 || ((n % 100) >= 2 && (n % 100) <= 4 && n == Math.floor(n))) {
    return 'few';
  }
  if ((n % 100) >= 11 && (n % 100) <= 19 && n == Math.floor(n)) {
    return 'many';
  }
  return 'other';
},"nl":function(n){return n===1?"one":"other"},"no":function(n){return n===1?"one":"other"},"pl":function(n){
  if (n == 1) {
    return 'one';
  }
  if ((n % 10) >= 2 && (n % 10) <= 4 &&
      ((n % 100) < 12 || (n % 100) > 14) && n == Math.floor(n)) {
    return 'few';
  }
  if ((n % 10) === 0 || n != 1 && (n % 10) == 1 ||
      ((n % 10) >= 5 && (n % 10) <= 9 || (n % 100) >= 12 && (n % 100) <= 14) &&
      n == Math.floor(n)) {
    return 'many';
  }
  return 'other';
},"pt":function(n){return n===1?"one":"other"},"ro":function(n){
  if (n == 1) {
    return 'one';
  }
  if (n === 0 || n != 1 && (n % 100) >= 1 &&
      (n % 100) <= 19 && n == Math.floor(n)) {
    return 'few';
  }
  return 'other';
},"ru":function(n){
  if ((n % 10) == 1 && (n % 100) != 11) {
    return 'one';
  }
  if ((n % 10) >= 2 && (n % 10) <= 4 &&
      ((n % 100) < 12 || (n % 100) > 14) && n == Math.floor(n)) {
    return 'few';
  }
  if ((n % 10) === 0 || ((n % 10) >= 5 && (n % 10) <= 9) ||
      ((n % 100) >= 11 && (n % 100) <= 14) && n == Math.floor(n)) {
    return 'many';
  }
  return 'other';
},"sk":function(n){
  if (n == 1) {
    return 'one';
  }
  if (n == 2 || n == 3 || n == 4) {
    return 'few';
  }
  return 'other';
},"sl":function(n){
  if ((n % 100) == 1) {
    return 'one';
  }
  if ((n % 100) == 2) {
    return 'two';
  }
  if ((n % 100) == 3 || (n % 100) == 4) {
    return 'few';
  }
  return 'other';
},"sq":function(n){return n===1?"one":"other"},"sr":function(n){
  if ((n % 10) == 1 && (n % 100) != 11) {
    return 'one';
  }
  if ((n % 10) >= 2 && (n % 10) <= 4 &&
      ((n % 100) < 12 || (n % 100) > 14) && n == Math.floor(n)) {
    return 'few';
  }
  if ((n % 10) === 0 || ((n % 10) >= 5 && (n % 10) <= 9) ||
      ((n % 100) >= 11 && (n % 100) <= 14) && n == Math.floor(n)) {
    return 'many';
  }
  return 'other';
},"sv":function(n){return n===1?"one":"other"},"ta":function(n){return n===1?"one":"other"},"th":function(n){return "other"},"tr":function(n){return n===1?"one":"other"},"uk":function(n){
  if ((n % 10) == 1 && (n % 100) != 11) {
    return 'one';
  }
  if ((n % 10) >= 2 && (n % 10) <= 4 &&
      ((n % 100) < 12 || (n % 100) > 14) && n == Math.floor(n)) {
    return 'few';
  }
  if ((n % 10) === 0 || ((n % 10) >= 5 && (n % 10) <= 9) ||
      ((n % 100) >= 11 && (n % 100) <= 14) && n == Math.floor(n)) {
    return 'many';
  }
  return 'other';
},"ur":function(n){return n===1?"one":"other"},"vi":function(n){return "other"},"zh":function(n){return "other"}},
c:function(d,k){if(!d)throw new Error("MessageFormat: Data required for '"+k+"'.")},
n:function(d,k,o){if(isNaN(d[k]))throw new Error("MessageFormat: '"+k+"' isn't a number.");return d[k]-(o||0)},
v:function(d,k){eval_locale.c(d,k);return d[k]},
p:function(d,k,o,l,p){eval_locale.c(d,k);return d[k] in p?p[d[k]]:(k=eval_locale.lc[l](d[k]-o),k in p?p[k]:p.other)},
s:function(d,k,p){eval_locale.c(d,k);return d[k] in p?p[d[k]]:p.other}};
(window.blockly = window.blockly || {}).eval_locale = {
"badColorStringError":function(d){return "تۆ ریزبەندی رەنگێکی رێگەپێنەدراوت بەکار هێناوە: "+eval_locale.v(d,"val")},
"badStyleStringError":function(d){return "تۆ شێوازی رەنگێکی رێگەپێنەدراوت بەکار هێناوە: "+eval_locale.v(d,"val")},
"circleBlockTitle":function(d){return "بازنە (نيوە تيرەى بازنە، شێواز، ڕەنگ)"},
"displayBlockTitle":function(d){return "هەڵسەنگێنە"},
"ellipseBlockTitle":function(d){return "شێوە هێلكەيى (بەرين، بەرزى، شێواز، ڕەنگ)"},
"extraTopBlocks":function(d){return "تۆ بلۆکی هاوپێچ نەکراوت هەیە. ئایا مەبەستت هاوپێچکردنی ئەمە بۆ پارچەی \"هەڵسەنگاندن\"؟"},
"infiniteRecursionError":function(d){return "فەرمانەکەی تۆ خۆی بانگ دەکاتەوە. ئێمە وەستاندوومانە، ئەگەرنا هەتاهەتایە خۆی بانگ دەکاتەوە."},
"overlayBlockTitle":function(d){return "دادەپۆشى (لووتكە، خوارەوە)"},
"placeImageBlockTitle":function(d){return "شوێن-وێنە (س, ص,، وێنە)"},
"offsetBlockTitle":function(d){return "ئۆفسێت دات (س, ص، وێنە)"},
"rectangleBlockTitle":function(d){return "لاکێشە (پانی، بەرزى، شێواز، ڕەنگ)"},
"reinfFeedbackMsg":function(d){return "تۆ دەتوانی دوکمەی \"بهێڵە يارى دەكات\" لێبدەی بۆ دەستکاریکردنی پرۆگرام."},
"rotateImageBlockTitle":function(d){return "بسوڕێنەوە (پلە، وێنە)"},
"scaleImageBlockTitle":function(d){return "ئەندازە (هۆكار، وێنە)"},
"squareBlockTitle":function(d){return "چوارگۆشە (قەبارە، شێواز، ڕەنگ)"},
"starBlockTitle":function(d){return "ئەستێرە (نيوە تيرەى ، شێواز، ڕەنگ)"},
"radialStarBlockTitle":function(d){return "ئەستێرە-نیو کەوانەیی (خاڵ، ناوەكى ، دەرەوە، شێواز، ڕەنگ)"},
"polygonBlockTitle":function(d){return "شێوەيەكى فرەلا (لا، درێژى، شێواز، ڕەنگ)"},
"stringAppendBlockTitle":function(d){return "ریزێک-دەیکات بە پاشکۆ (يەكەم، دووەم)"},
"stringLengthBlockTitle":function(d){return "زنجیره‌نووسین-درێژی (زنجیره‌نووسین)"},
"textBlockTitle":function(d){return "نووسين (زنجیرەنووسین، قەبارە، ڕەنگ)"},
"triangleBlockTitle":function(d){return "سێگۆشە (قەبارە، شێواز، ڕەنگ)"},
"underlayBlockTitle":function(d){return "چینی خوارەوە(خوارەوە، لووتكە)"},
"outline":function(d){return "هێلە سەرەكيەكان"},
"solid":function(d){return "پتەو"},
"string":function(d){return "زنجیرەنووسین"},
"stringMismatchError":function(d){return "تۆ زنجیرە نووسینێکت هەیە بە نووسینی پیتی گەورە هەڵە."},
"userCodeException":function(d){return "هەڵەيێك ڕووى دا لە كاتى جێبەجێکردنی كۆدى تۆ."},
"wrongBooleanError":function(d){return "بلۆكى تۆ بە  بۆ بەهاى هەڵە بولين هەڵدەسەنگێنن."}};