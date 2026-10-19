/**
 * Tema site-ului (luminos / întunecat). Paginile sunt statice (ISR), deci tema nu
 * se poate decide pe server: un script mic, rulat în <head> înainte de randare,
 * pune `data-theme` pe <html> — fără clipire. Implicit urmează dispozitivul
 * (prefers-color-scheme); o alegere explicită din comutator stă în localStorage.
 */
export const CHEIE_TEMA = 'tema'

export const SCRIPT_TEMA = `(function(){try{
var k=${JSON.stringify(CHEIE_TEMA)},d=document.documentElement,m=window.matchMedia('(prefers-color-scheme: dark)');
function a(){var t=null;try{t=localStorage.getItem(k)}catch(e){}
d.dataset.theme=t==='dark'||t==='light'?t:(m.matches?'dark':'light')}
a();m.addEventListener('change',a);
window.addEventListener('storage',function(e){if(e.key===k)a()});
}catch(e){}})()`
