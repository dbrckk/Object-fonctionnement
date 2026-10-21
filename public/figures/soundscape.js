/* Object Fonctionnement — offline procedural sound design.
   Synthesized locally with Web Audio; no samples, external requests or tracking.
   Low-output mix. All AudioContexts start only after a direct user gesture. */
(() => {
  "use strict";
  const tag = window.__objectName
    || (/washing/i.test(document.title) || /lave-linge/i.test(document.title) ? "washer"
      : (/vending/i.test(document.title) || /distributeur/i.test(document.title) ? "vending" : "unknown"));
  const K = {kettle:1,toaster:1,fan:1,lock:1,bicycle:1,coffee:1,flashlight:1,washer:1,vending:1};
  if(!Object.hasOwn(K,tag))return;

  const AudioCtor=window.AudioContext||window.webkitAudioContext;
  let enabled=true,volume=.75,stereoPan=0,ctx=null,mix=null,noiseBuffer=null,ambient=null,prev={},activeVoices=0,lastTexture=-1;
  const debug={mode:tag,enabled:true,volume:.75,gestures:0,notes:0,ambient:false,cues:{}};
  window.__soundDebug=debug;
  const maxVoices=14;
  function initialize(){
    if(!enabled||!AudioCtor)return false;
    if(ctx){if(ctx.state==="suspended")void ctx.resume().catch(()=>{});return true;}
    try{
      ctx=new AudioCtor({latencyHint:"interactive"});
      mix=ctx.createGain();mix.gain.value=.22*volume;
      const limiter=ctx.createDynamicsCompressor();
      limiter.threshold.value=-19;limiter.knee.value=9;limiter.ratio.value=7;
      limiter.attack.value=.004;limiter.release.value=.13;
      mix.connect(limiter);limiter.connect(ctx.destination);
      const rate=ctx.sampleRate;
      noiseBuffer=ctx.createBuffer(1,rate,rate);
      const data=noiseBuffer.getChannelData(0);
      let seed=7919;
      for(let i=0;i<data.length;i++){
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;
        data[i]=((seed/4294967295)*2-1)*.8;
      }
      if(ctx.state==="suspended")void ctx.resume().catch(()=>{});
      return true;
    }catch{ctx=null;return false;}
  }
  function envelope(gain,t,attack,duration,volume){
    gain.gain.setValueAtTime(.0001,t);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),t+Math.max(.003,attack));
    gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
  }
  function routeAudio(input){
    if(ctx.createStereoPanner){
      const pan=ctx.createStereoPanner();
      pan.pan.value=stereoPan;
      input.connect(pan);pan.connect(mix);
      return ()=>{pan.disconnect();};
    }
    input.connect(mix);
    return ()=>{};
  }
  function setVolume(next){
    const num=Number(next);
    if(!Number.isFinite(num))return;
    volume=Math.max(0,Math.min(1,num));
    debug.volume=volume;
    if(mix&&ctx)mix.gain.setTargetAtTime(.22*volume,ctx.currentTime,.045);
  }
  function tone(frequency=440,duration=.14,wave="sine",vol=.2,slide=1,delay=0){
    if(!ctx||activeVoices>=maxVoices)return;
    const t=ctx.currentTime+delay;
    const osc=ctx.createOscillator(),amp=ctx.createGain();
    osc.type=wave;
    osc.frequency.setValueAtTime(Math.max(35,frequency),t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(35,frequency*slide),t+duration);
    envelope(amp,t,Math.min(.014,duration*.19),duration,vol);
    osc.connect(amp);const disconnect=routeAudio(amp);osc.start(t);osc.stop(t+duration+.02);
    activeVoices++;
    osc.onended=()=>{activeVoices=Math.max(0,activeVoices-1);osc.disconnect();amp.disconnect();disconnect();};
    debug.notes++;
  }
  function noise(duration=.16,cutoff=1800,vol=.13,filterType="lowpass",delay=0){
    if(!ctx||!noiseBuffer||activeVoices>=maxVoices)return;
    const t=ctx.currentTime+delay;
    const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),amp=ctx.createGain();
    src.buffer=noiseBuffer;
    filter.type=filterType;filter.frequency.value=cutoff;filter.Q.value=.7;
    envelope(amp,t,.008,duration,vol);
    src.connect(filter);filter.connect(amp);const disconnect=routeAudio(amp);src.start(t);src.stop(t+duration+.02);
    activeVoices++;
    src.onended=()=>{activeVoices=Math.max(0,activeVoices-1);src.disconnect();filter.disconnect();amp.disconnect();disconnect();};
    debug.notes++;
  }
  const fx={
    tap(){tone(680,.046,"sine",.065,.74);},
    switch(){tone(520,.045,"triangle",.2,.51);tone(190,.08,"sine",.09,.83,.03);},
    mechanical(){tone(280,.06,"triangle",.21,.49);noise(.046,850,.07);},
    latch(){tone(760,.055,"triangle",.16,.45);tone(1180,.09,"sine",.1,1.02,.055);},
    pop(){tone(210,.07,"square",.17,.63);noise(.14,1300,.13,"highpass",.06);tone(880,.24,"sine",.13,.65,.11);},
    coin(){tone(2100,.14,"sine",.1,.58);tone(1250,.19,"triangle",.11,.7,.09);},
    dispense(){noise(.28,480,.11);tone(110,.27,"sawtooth",.07,.85);tone(480,.14,"sine",.1,.7,.27);},
    // Short winding coil: mechanical start, then a falling item lands with
    // a soft body-specific impact. No samples or network dependencies.
    coil(){tone(155,.22,"triangle",.12,1.44);noise(.19,640,.09,"bandpass",.03);},
    landing(){noise(.12,600,.12,"lowpass");tone(210,.17,"sine",.12,.55,.03);},
    pickup(){tone(330,.07,"triangle",.09,.62);tone(590,.1,"sine",.08,.77,.04);},
    pour(){noise(.34,900,.13,"bandpass");tone(350,.14,"sine",.07,.71,.07);},
    water(){noise(.34,2200,.12,"lowpass");tone(430,.075,"sine",.055,.8,.05);},
    bubbling(){noise(.18,700,.075,"lowpass");tone(240,.07,"sine",.055,.67);},
    motor(){tone(144,.28,"sawtooth",.095,.93);tone(288,.26,"sine",.085,1.08);},
    air(){noise(.38,730,.11,"lowpass");tone(110,.13,"sine",.055,.81);},
    pump(){noise(.16,390,.17,"lowpass");tone(180,.15,"triangle",.12,.67);},
    drip(){tone(620,.07,"sine",.12,.48);noise(.06,1400,.06,"bandpass");},
    heat(){tone(230,.16,"triangle",.08,1.14);noise(.17,510,.075);},
    success(){tone(625,.13,"sine",.14,1.08);tone(835,.22,"sine",.11,1.02,.09);},
    warning(){tone(360,.11,"triangle",.13,.77);}
  };
  function play(name){
    if(!enabled||volume<=0||document.hidden||!initialize())return;
    if(fx[name]){
      fx[name]();
      debug.cues[name]=(debug.cues[name]||0)+1;
    }
  }
  function classify(action){
    const a=action.toLocaleLowerCase("fr");
    if(tag==="fan"&&/marche|arrêt|vitesse/.test(a))return "motor";
    if(tag==="washer"&&/start|démarrer|pause/.test(a))return "motor";
    if(tag==="coffee"&&/préparer|extraction/.test(a))return "drip";
    if(tag==="kettle"&&/chauffer/.test(a))return "bubbling";
    if(tag==="toaster"&&/abaisser|griller/.test(a))return "mechanical";
    if(/rempl|ajouter de l'eau|add soap|lessive/.test(a))return "water";
    if(/chauff|grill|préparer|start|démarrer|cycle/.test(a))return "heat";
    if(/verser|servir|récupér|take your|take coins/.test(a))return "pour";
    if(/éject|pain|load laundry|charger/.test(a))return "mechanical";
    if(/coin|pièce|50 cts|monnaie/.test(a))return "coin";
    if(/produit|drink|choisir|code|distribution/.test(a))return "dispense";
    if(/pomper|piston|raccorder|valve/.test(a))return "pump";
    if(/vitesse|oscillat|fan/.test(a))return "air";
    if(/tourner|goupille|verrouil|clé|hublot|door/.test(a))return "latch";
    if(/interrup|marche|arrêt|intensité|compartiment/.test(a))return "switch";
    if(/programme|niveau|couleur|label|repère/.test(a))return "tap";
    return "mechanical";
  }
  function stopAmbient(){
    if(!ambient||!ctx)return;
    const a=ambient;
    ambient=null;debug.ambient=false;
    const now=ctx.currentTime;
    a.g.gain.cancelScheduledValues(now);
    a.g.gain.setTargetAtTime(.0001,now,.055);
    for(const osc of a.osc)try{osc.stop(now+.35);}catch{}
  }
  function setAmbient(frequency,intensity){
    if(!ctx||!enabled||document.hidden||intensity<=0){stopAmbient();return;}
    const time=ctx.currentTime;
    if(!ambient){
      const g=ctx.createGain();g.gain.value=.0001;
      g.connect(mix);
      const first=ctx.createOscillator(),second=ctx.createOscillator();
      first.type=tag==="fan"?"sine":"triangle";second.type="sine";
      first.connect(g);second.connect(g);
      first.start();second.start();
      ambient={g,osc:[first,second]};
      debug.ambient=true;
    }
    ambient.osc[0].frequency.setTargetAtTime(frequency,time,.1);
    ambient.osc[1].frequency.setTargetAtTime(frequency*1.98,time,.1);
    ambient.g.gain.setTargetAtTime(Math.min(.08,Math.max(.007,intensity*.05)),time,.13);
  }
  function snapshot(s){
    if(!s)return {};
    return {
      heating:!!s.heating,toasting:!!s.toasting,brewing:!!s.brewing,
      speed:+(s.speed||0),run:!!s.run,pumping:!!s.pumping,
      done:!!s.done,phase:s.phase,drop:!!s.drop,
      credit:+(s.credit||0),tray:!!s.tray,
      on:!!s.on,locked:s.locked,paused:!!s.paused,
      prog:+(s.prog||0),tau:+(s.tau||0),
      pressure:+(s.pressure||0)
    };
  }
  // Audio follows the same compact programme timeline as the original
  // ColorFigures washing simulation. No new sound files or downloads.
  function washerPhase(s){
    if(!s.run)return "idle";
    const p=[{fill:1.4,wash:6,drain:7},{fill:1,wash:3.6,drain:4.4},{fill:0,wash:0,drain:0}][Math.max(0,Math.min(2,Math.floor(s.prog)))];
    return s.tau<p.fill?"fill":s.tau<p.wash?"wash":s.tau<p.drain?"drain":"spin";
  }
  function sync(){
    if(!document.body)return;
    const s=snapshot(window.__st);
    if(enabled&&volume>0&&ctx&&ctx.state==="running"){
      const washPhase=tag==="washer"?washerPhase(s):null;
      const washerActive=tag==="washer"&&s.run&&!s.paused;
      const washerIntensity=washerActive?(washPhase==="spin"?.95:washPhase==="wash"?.53:washPhase==="drain"?.23:0):0;
      const intensity=tag==="washer"?washerIntensity:
        s.heating?.7:s.toasting?.5:s.brewing?.75:s.speed>0?s.speed*.35:s.run?.8:s.drop?.6:0;
      const base=tag==="fan"?145:tag==="washer"?
        (washPhase==="spin"?185:washPhase==="wash"?123:90):
        tag==="coffee"?195:tag==="kettle"?245:160;
      setAmbient(base+(s.speed||0)*15,Math.min(intensity,1));
      const texture=Math.floor(ctx.currentTime*(tag==="coffee"?1.65:tag==="kettle"?1.15:.8));
      if(intensity>0&&texture!==lastTexture){
        lastTexture=texture;
        if(tag==="coffee"&&s.brewing)play("drip");
        else if(tag==="kettle"&&s.heating)play("bubbling");
        else if(tag==="toaster"&&s.toasting)noise(.11,1800,.037);
        else if(tag==="washer"&&washerActive){
          if(washPhase==="fill"||washPhase==="drain")play("water");
          else noise(washPhase==="spin"?.18:.12,washPhase==="spin"?460:300,
            washPhase==="spin"?.06:.034);
        }
        else if(tag==="fan"&&s.speed>0)noise(.25,700+s.speed*100,.045);
      }
      if(prev.heating&&!s.heating&&s.phase==="done")play("success");
      if(prev.toasting&&!s.toasting&&s.done)play("pop");
      if(tag==="coffee"&&!prev.brewing&&s.brewing)play("water");
      if(prev.brewing&&!s.brewing&&s.done!==true)play("success");
      if(tag==="vending"){
        if(!prev.drop&&s.drop)play("coil");
        if(prev.drop&&!s.drop&&s.tray)play("landing");
        if(prev.tray&&!s.tray)play("pickup");
      }
      if(tag==="washer"&&washerActive&&!prev.paused){
        const previousPhase=washerPhase(prev);
        if(prev.run&&previousPhase!==washPhase){
          if(washPhase==="spin")play("motor");
          else if(washPhase==="fill"||washPhase==="drain")play("water");
        }
      }
      if(prev.run&&!s.run)play("success");
    }else stopAmbient();
    prev=s;
  }
  const applySetting=(value)=>{
    enabled=Boolean(value);debug.enabled=enabled;
    if(!enabled)stopAmbient();
    const b=document.getElementById("figure-sound");
    if(b){b.textContent=enabled?"Son activé":"Son coupé";b.setAttribute("aria-pressed",String(enabled));}
  };
  window.addEventListener("message",event=>{
    if(event.source!==window.parent)return;
    if(event.data?.type==="object-figure:sound-setting"){
      applySetting(event.data.enabled);
      if(event.data.volume!==undefined)setVolume(event.data.volume);
    }
  });
  function notifyParent(){
    if(window.parent!==window)window.parent.postMessage({type:"object-figure:sound-preference",enabled},"*");
  }
  function mountControl(){
    const header=document.querySelector("header");
    if(!header)return;
    const button=document.createElement("button");
    button.id="figure-sound";
    button.type="button";
    button.className="sound-switch";
    button.setAttribute("aria-label","Activer ou couper les bruitages");
    header.appendChild(button);
    button.addEventListener("click",()=>{
      applySetting(!enabled);
      if(enabled){initialize();play("success");}
      notifyParent();
    });
    applySetting(enabled);
  }
  document.addEventListener("pointerdown",event=>{
    stereoPan=Math.max(-.45,Math.min(.45,(event.clientX/window.innerWidth-.5)*.75));
    const action=event.target.closest?.("[data-act]");
    if(action){debug.gestures++;play(classify(action.dataset.act));}
  },{capture:true});
  document.addEventListener("click",event=>{
    const x=event.clientX;
    if(x>0)stereoPan=Math.max(-.45,Math.min(.45,(x/window.innerWidth-.5)*.75));
    const button=event.target.closest?.("button.act,button.chip,button.sw");
    if(!button||button.id==="figure-sound")return;
    debug.gestures++;
    // In ColorFigures action handlers are attached to the button; bubble phase sees their final state.
    const label=(button.textContent||"").trim();
    play(button.classList.contains("sw")?"tap":classify(label));
  },{capture:true});
  document.addEventListener("visibilitychange",()=>{if(document.hidden)stopAmbient();});
  window.addEventListener("pagehide",()=>{
    stopAmbient();
    if(ctx&&ctx.state!=="closed")void ctx.close().catch(()=>{});
  });
  mountControl();
  if(window.parent!==window)window.parent.postMessage({type:"object-figure:sound-ready"},"*");
  setInterval(sync,140);
  sync();
})();
