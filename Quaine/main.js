'use strict'; let a = "'"; let s = 'let a = ""; let s = ; console.log(a + "use strict" + a + "; " + s.substring(0, 9) + a + s.substring(9, 20) + a + s + a + s.substring(20));'; console.log(a + "use strict" + a + "; " + s.substring(0, 9) + a + s.substring(9, 20) + a + s + a + s.substring(20));

let n = "\n"; let sl = "\\"; s = 'let n = ""; let sl = ""; s = ; console.log(n + n + s.substring(0, 9) + sl + "n" + s.substring(9, 22) + sl + sl + s.substring(22, 29) + a + s + a + s.substring(29));'; console.log(n + n + s.substring(0, 9) + sl + "n" + s.substring(9, 22) + sl + sl + s.substring(22, 29) + a + s + a + s.substring(29));

let varUndefined; s = 'let varUndefined; s = ; console.log(n + n + s.substring(0, 22) + a + s + a + s.substring(22));'; console.log(n + n + s.substring(0, 22) + a + s + a + s.substring(22));
let varIsFirst = true; s = 'let varIsFirst = true; s = ; console.log(n + s.substring(0, 27) + a + s + a + s.substring(27));'; console.log(n + s.substring(0, 27) + a + s + a + s.substring(27));

function checkFunc(arg) { if (varIsFirst == true) { s = 'function checkFunc(arg) { if (varIsFirst == true) {s = ; console.log(n + s.substring(0, 55) + a + s + a + s.substring(55)); }'; console.log(n + n + s.substring(0, 55) + a + s + a + s.substring(55)); }
    if (arg === undefined) { varUndefined = 30.30; if (varIsFirst == true) { s = '    if (arg === undefined) { varUndefined = 30.30; if (varIsFirst == true) { s = ; console.log(n + s.substring(0, 80) + a + s + a + s.substring(80)); } }'; console.log(n + n + s.substring(0, 80) + a + s + a + s.substring(80)); } }
    else { varUndefined = 20.20; if (varIsFirst == true) { s = '    else { varUndefined = 20.20; if (varIsFirst == true) { s = ; console.log(n + s.substring(0, 61) + a + s + a + s.substring(61)); } }'; console.log(n + s.substring(0, 61) + a + s + a + s.substring(61)); } }
    if (varIsFirst == true) { varIsFirst = false; s = '    if (varIsFirst == true) { varIsFirst = false; s = ; console.log(n + s.substring(0, 52) + a + s + a + s.substring(52)); }'; console.log(n + s.substring(0, 52) + a + s + a + s.substring(52)); }
}

checkFunc(varUndefined); s = 'checkFunc(varUndefined); s = ; console.log(n + s.substring(0, 29) + a + s + a + s.substring(29));'; console.log(n + s.substring(0, 29) + a + s + a + s.substring(29));
varUndefined = 30.239; s = 'varUndefined = 30.239; s = ; console.log(n + s.substring(0, 27) + a + s + a + s.substring(27));'; console.log(n + s.substring(0, 27) + a + s + a + s.substring(27));
checkFunc(varUndefined); s = 'checkFunc(varUndefined); s = ; console.log(n + s.substring(0, 29) + a + s + a + s.substring(29));'; console.log(n + s.substring(0, 29) + a + s + a + s.substring(29));
