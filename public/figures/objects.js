/* Object Fonctionnement — seven original educational scenes built on ColorFigures.
   Core engine: Copyright April Zhu & Tolga Cohce, MIT (COLORFIGURES-LICENSE).
   All durations are accelerated illustrations, not safety-critical appliance timings. */
(() => {
  "use strict";
  const white = matOf('#f8f5ec');
  const steel = matOf('#aebac5');
  const orange = matOf('#ed9a52');
  const blue = matOf('#6ca9da');
  const green = matOf('#58b88d');
  const red = matOf('#e76349');
  const dark = matOf('#333b43');
  const ensure = (condition, ui, why) => {if (condition) return true;ui.flash(why,2200);return false;};
  const cuboidPoints=(x0,y0,z0,x1,y1,z1)=>{const p=[];for(const x of [x0,x1])for(const y of [y0,y1])for(const z of [z0,z1])p.push([x,y,z]);return p;};
  const bench=(w,d,h=3)=>board(-12,-14,w+12,d+14,h,7);
  const shadow=(w,d,h,z0=3)=>castShadow(cuboidPoints(2,2,z0,w,d,h),z0,boardTop(-12,-14,w+12,d+14,z0,7));
  const housing=(x0,x1,y0,y1,z0,z1,r,m)=>{
    const prof=rrUV(y0,z0,y1,z1,r);
    return extrude(prof,x0,x1,m)+shape(on(PX(x1),prof),m.l,1.7)+hullInk([...on(PX(x0),prof),...on(PX(x1),prof)],2.6);
  };
  const circleFront=(x,y,z,r,col,w=1)=>shape(on(PX(x),ellUV(y,z,r,r,28)),col,w);
  const frontLabel=(x,y,z,value,size=3)=>tx(x,y,z,value,size,INK,800);
  const waterWave=(x,y0,y1,level,t=0,col='#5cabdf')=>{
    const a=[];for(let y=y0;y<=y1+.01;y+=2) a.push([x,y,level+.5*Math.sin(y*.37+t*5)]);
    return fill(pd([...a,[x,y1,8],[x,y0,8]]),col,'opacity=".57"');
  };
  const anim=(ui,duration,update,done)=>{
    let elapsed=0;
    ui.animate(dt=>{
      elapsed=Math.min(duration,elapsed+dt);
      update(elapsed/duration,elapsed);
      if(elapsed>=duration){if(done)done();return false;}
      return true;
    });
  };
  const run=(cfg)=>{
    const ui=mountFigure({...cfg,credit:true});
    const labels=[['.idea strong','À retenir'],['label[for=wb]','Effet dessin à la main'],['#pals',null],['#lblctl label','Repères']];
    for(const [selector,title] of labels){const el=document.querySelector(selector);if(el&&title)el.textContent=title;}
    const colorLabel=document.querySelector('#pals')?.previousElementSibling;
    if(colorLabel)colorLabel.textContent='Couleur';
    const mark=document.querySelector('.made-with a');if(mark){mark.textContent='Moteur ColorFigures — licence MIT ↗';}
    return ui;
  };
  const DEF = {
    kettle(){
      const s={water:.55,hot:0,heating:false,phase:'ready',lid:false,steam:0};
      const W=60,D=72,H=91;
      function scene(st,m){
        let a=bench(W,D)+shadow(W,D,H);
        // Spout is behind the kettle's front silhouette; its mouth remains open.
        a+=rod([35,9,58],[46,-12,65],8,steel,toneI,1.2,4);
        a+=shape([[44,-16,65],[51,-13,65],[50,-12,70],[43,-15,70]],'#4b5964',1);
        a+=housing(10,53,13,62,7,70,13,m);
        // Reservoir gauge, translucent and filled to the real state level.
        const gw=rrUV(19,19,31,54,3),gwp=on(PX(53.4),gw);
        a+=shape(gwp,'#d9f1f4',1.1);
        a+=clipTo(gwp,waterWave(53.5,19.6,30.4,20+st.water*30,st.hot*3));
        for(const z of [27,35,43,51]) a+=line([[53.7,30,z],[53.7,33,z]],.7);
        // Lid and metallic heating base, which warms up with the heater.
        a+=cyl(30,38,68,72,21,steel);
        a+=cyl(30,38,72,st.lid?82:75,6,dark);
        if(st.lid) a+=rod([30,38,75],[15,54,85],3,dark);
        a+=box(8,11,4,54,64,9,dark);
        a+=circleFront(53.6,45,22,4,st.heating?'#ff653e':'#788987',1);
        // Rounded grip and the insulated return on the right side.
        a+=rod([27,65,61],[26,82,54],5,dark);
        a+=rod([26,82,54],[25,81,33],5,dark);
        a+=rod([25,81,33],[29,63,29],5,dark);
        if(st.steam>0){
          for(let i=0;i<3;i++){
            const x=32+i*5,y=35+i*4;
            a+= '<path d="'+pd([[x,y,80],[x+1,y+2,86+st.steam*5],[x-2,y+3,94+st.steam*10]],false)+'" fill="none" stroke="#90b9c3" stroke-width="1.9" opacity="'+(.55*st.steam).toFixed(2)+'"/>';
          }
        }
        a+=tag([53,43,22],-56,37,'RÉSISTANCE',st.heating);
        a+=tag([53,22,43],-55,-35,'EAU',st.water>0);
        a+=tag([52,43,22],44,-39,'ARRÊT AUTO.',st.phase==='done');
        return a;
      }
      const heat=(st,ui)=>{
        if(!ensure(st.water>.05,ui,"Remplis le réservoir avant de chauffer."))return;
        if(!ensure(!st.lid,ui,"Ferme le couvercle avant de chauffer."))return;
        if(st.heating)return;
        st.heating=true;st.phase='heating';st.hot=0;st.steam=0;
        anim(ui,6,(p)=>{st.hot=p;st.steam=Math.max(0,(p-.43)*1.75);},()=>{
          st.heating=false;st.phase='done';st.steam=.42;ui.flash("Ébullition : arrêt automatique du chauffage.");
        });
      };
      return {
        fig:'01',title:'Bouilloire électrique',hint:"Ajoute de l'eau, chauffe et observe le thermostat",size:[W,D,H],palette:'tomato',state:s,scene,
        idea:"La résistance chauffe l'eau ; un interrupteur thermique provoque l'arrêt automatique.",readout:st=>st.heating?'CHAUFFE · '+Math.round(st.hot*100)+' %':st.phase==='done'?'ARRÊT AUTOMATIQUE · EAU CHAUDE':st.water<.05?'RÉSERVOIR VIDE':'PRÊTE · NIVEAU '+Math.round(st.water*100)+' %',
        buttons:[
          {label:"Remplir d'eau",onClick(st,ui){if(st.heating)return ui.flash("Ne pas ouvrir pendant la chauffe.");st.water=.85;st.hot=0;st.phase='ready';st.steam=0;}},
          {label:'Chauffer',onClick:heat},
          {label:'Verser',onClick(st,ui){if(st.heating)return ui.flash("Attends l'arrêt automatique.");if(st.water<.05)return ui.flash("Le réservoir est vide.");st.water=Math.max(0,st.water-.28);st.steam=0;st.hot=0;st.phase='ready';ui.flash("Eau versée avec précaution.");}},
          {label:'Ouvrir / fermer couvercle',onClick(st,ui){if(st.heating)return ui.flash("Attends la fin de la chauffe.");st.lid=!st.lid;}}
        ]};
    },
    toaster(){
      const s={bread:0,hot:0,toasting:false,done:false,level:2,eject:0};
      const W=55,D=77,H=67, body='#ebaa66';
      function scene(st,m){
        let a=bench(W,D)+shadow(W,D,H);
        // Bread rises above real top slots after ejection.
        for(let i=0;i<2;i++){
          const y=24+i*24;const lift=st.toasting?2:st.done?16:st.bread?10:0;
          if(st.bread)a+=housing(11,39,y-8,y+8,42+lift,64+lift,5,st.hot>.2?orange:matOf('#f1d3a0'));
        }
        a+=housing(5,49,8,70,6,50,10,m);
        for(let i=0;i<2;i++){
          const y=24+i*24;
          a+=shape(on(PZ(50.4),rrUV(16,y-8,39,y+8,3)),'#3e3c38',1.7);
          if(st.toasting){
            for(let k=0;k<5;k++)a+=line([[21+k*3,y-6,50.8],[21+k*3,y+6,50.8]],1.1);
          }
        }
        // temperature selector and movable lever
        a+=cylX(49,53,18,22,6,steel);
        a+=frontLabel(53,18,22,st.level+'',3);
        a+=box(49,57,20-st.eject*3,58,64,28-st.eject*3,dark);
        a+=rod([55,63,24-st.eject*3],[62,63,24-st.eject*3],2.8,steel);
        a+=circleFront(49.4,48,22,3,st.toasting?'#ef553e':'#71817d');
        a+=tag([30,24,49],-50,-28,'FENTES',st.bread>0);
        a+=tag([49,48,22],38,32,'RÉSISTANCES',st.toasting);
        a+=tag([52,18,22],32,-35,'MINUTERIE',st.toasting);
        return a;
      }
      return {fig:'02',title:'Grille-pain',hint:'Observe le pain et le déclenchement du mécanisme',size:[W,D,H+16],palette:'mustard',state:s,scene,
        idea:"Des résistances rayonnent de la chaleur ; la minuterie libère le chariot en fin de cycle.",
        readout:st=>st.toasting?"GRILLAGE · "+Math.round(st.hot*100)+" %":st.done?"TERMINÉ · PAIN ÉJECTÉ":st.bread?"PAIN CHARGÉ · NIVEAU "+st.level:"FENTES VIDES",
        buttons:[
          {label:'Insérer le pain',onClick(st,ui){if(st.toasting)return ui.flash("Patiente jusqu'à l'éjection.");st.bread=2;st.done=false;st.hot=0;st.eject=0;}},
          {label:'Régler le brunissage',choices:st=>[1,2,3,4,5].map(n=>({label:"Niveau "+n,current:st.level===n,onClick(){st.level=n;}}))},
          {label:'Abaisser / griller',onClick(st,ui){if(!ensure(st.bread>0,ui,"Insère d'abord une tranche."))return;if(st.toasting)return;st.toasting=true;st.done=false;st.eject=0;st.hot=0;anim(ui,2.4+st.level*.65,p=>{st.hot=p;},()=>{st.toasting=false;st.done=true;st.eject=1;ui.flash("Pop ! Chariot libéré.");});}},
          {label:'Retirer le pain',onClick(st,ui){if(st.toasting)return ui.flash("Arrête la cuisson avant de retirer le pain.");if(!st.bread)return ui.flash("Aucune tranche.");st.bread=0;st.done=false;st.hot=0;st.eject=0;}}
        ]};
    },
    fan(){
      const s={speed:0,angle:0,oscillate:false,turn:0};
      const W=69,D=78,H=113;
      function scene(st,m){
        let a=bench(W,D)+shadow(W,D,H);
        a+=cyl(34,39,4,9,28,m);
        a+=cyl(34,39,9,12,19,steel);
        a+=rod([34,39,12],[34,39,68],3.9,steel);
        a+=cyl(34,39,66,73,8,steel);
        // motor cylinder and fixed bearing
        a+=cylX(26,45,39,81,13,dark);
        a+=rod([44,39,80],[51,39,80],3,steel);
        const front=53, oy=st.oscillate?Math.sin(st.angle)*6:0;
        // Three broad curved blades, rotated according to the virtual motor angle.
        for(let i=0;i<3;i++){
          const t=st.turn+i*Math.PI*2/3;
          const pts=[];
          for(const [r,delta] of [[7,-.3],[17,-.4],[30,-.15],[31,.45],[23,.6],[11,.25]]){
            pts.push([front,39+oy+r*Math.cos(t+delta),80+r*Math.sin(t+delta)]);
          }
          a+=shape(pts,['#f4b95b','#92cbbb','#ec8870'][i],1.3);
        }
        a+=cylX(49,56,39+oy,80,7,steel);
        // protective guard cage, front rim and radial wire guards
        a+=ink(pd(on(PX(58),ellUV(39+oy,80,37,37,64))),2.4);
        a+=ink(pd(on(PX(57),ellUV(39+oy,80,33,33,64))),1);
        for(let k=0;k<16;k++){
          const t=k*Math.PI/8;
          a+=line([[58,39+oy+8*Math.cos(t),80+8*Math.sin(t)],[58,39+oy+36*Math.cos(t),80+36*Math.sin(t)]],.65);
        }
        a+=circleFront(45,39+oy,80,6,'#414951');
        a+=cylX(35,41,40,23,6,steel);
        a+=frontLabel(41.4,40,23,''+st.speed,3.5);
        a+=tag([45,39,81],43,-38,'MOTEUR',st.speed>0);
        a+=tag([55,67+oy,80],38,13,'PALES',st.speed>0);
        a+=tag([39,38,23],-38,31,'VITESSE',st.speed>0);
        return a;
      }
      const start=(st,ui)=>{if(st.speed===0)return;st.spinToken=(st.spinToken||0)+1;const token=st.spinToken;ui.animate(dt=>{if(token!==st.spinToken||!st.speed)return false;st.turn+=dt*st.speed*7;if(st.oscillate)st.angle+=dt;return true;});};
      return {fig:'03',title:'Ventilateur',hint:'Active le moteur et règle sa vitesse',size:[W,D,H],palette:'mint',state:s,scene,
        idea:"Un moteur entraîne des pales inclinées et crée un mouvement d'air, sans réfrigérer l'air.",
        readout:st=>st.speed?'MOTEUR ACTIF · VITESSE '+st.speed:'MOTEUR ARRÊTÉ',
        buttons:[
          {label:'Marche / arrêt',onClick(st,ui){if(st.speed){st.speed=0;st.spinToken++;}else{st.speed=1;start(st,ui);}}},
          {label:'Vitesse',choices:st=>[1,2,3].map(n=>({label:'Vitesse '+n,current:st.speed===n,onClick(_st,ui){const was=st.speed;st.speed=n;if(!was)start(st,ui);}}))},
          {label:'Oscillation',onClick(st,ui){st.oscillate=!st.oscillate;ui.flash(st.oscillate?'Oscillation activée.':'Oscillation arrêtée.');}}
        ]};
    },
    lock(){
      const s={key:false,aligned:false,locked:true,angle:0};
      const W=66,D=79,H=76;
      const pins=[16,26,36,46,56];
      function scene(st,m){
        let a=bench(W,D)+shadow(W,D,H);
        a+=housing(10,48,10,70,11,64,5,m);
        a+=box(45,16,20,51,64,59,steel);
        // cylindrical plug and plug face with keyhole
        a+=cylX(48,56,40,39,21,steel);
        a+=circleFront(56.2,40,39,13,st.locked?'#525a5f':'#65ad85',1.4);
        a+=shape(on(PX(56.6),rrUV(38,32,42,43,1)),'#202329',1);
        // cutaway pins shown inside a transparent row
        a+=shape(on(PX(51.7),rrUV(17,52,65,64,2)),'#d7e3e4',1);
        for(let i=0;i<5;i++){
          const y=21+i*9.5;
          a+=box(52,y-2,st.aligned?56:54+i%3,55,y+2,62,st.aligned?green:orange);
        }
        // key bit sliding from the right-front
        if(st.key){
          a+=rod([55,40,38],[70,40,38],2.8,steel);
          a+=cylX(71,73,40,38,6,orange);
          for(let j=0;j<3;j++)a+=box(62+j*2,36,34+(j%2)*2,64+j*2,39,37,steel);
        }else{
          a+=rod([76,40,39],[86,40,39],2,steel);
          a+=cylX(85,87,40,39,5,orange);
        }
        a+=tag([53,23,58],-55,-35,'GOUPILLES',st.aligned);
        a+=tag([57,40,39],46,35,'CYLINDRE',!st.locked);
        a+=tag([55,40,39],-50,34,'CLÉ',st.key);
        return a;
      }
      return {fig:'04',title:'Serrure à goupilles',hint:'Insère la clé, aligne les goupilles, puis tourne',size:[W+19,D,H],palette:'cobalt',state:s,scene,
        idea:"Les dents de la bonne clé alignent les goupilles à la ligne de césure, autorisant la rotation.",
        readout:st=>st.locked?(st.key?'CLÉ INSÉRÉE · BARILLET PRÊT':'SERRURE VERROUILLÉE'):'DÉVERROUILLÉE',
        buttons:[
          {label:'Insérer la bonne clé',onClick(st){st.key=true;st.aligned=true;}},
          {label:'Tourner la clé',onClick(st,ui){if(!ensure(st.key&&st.aligned,ui,"Insère la bonne clé pour aligner les goupilles."))return;st.locked=!st.locked;st.angle=st.locked?0:90;ui.flash(st.locked?'Serrure verrouillée.':'Serrure déverrouillée.');}},
          {label:'Retirer la clé',onClick(st,ui){if(!st.key)return ui.flash("La clé n'est pas insérée.");st.key=false;st.aligned=false;}}
        ]};
    },
    bicycle(){
      const s={connected:false,pressure:0.7,piston:0,pumps:0,pumping:false};
      const W=94,D=92,H=113;
      function scene(st,m){
        let a=bench(W,D)+shadow(W,D,H);
        // Wheel and its valve, behind the pump.
        const q=on(PY(80),ellUV(53,43,27,27,48));
        a+=ink(pd(q),4.1)+ink(pd(on(PY(80),ellUV(53,43,20,20,48))),1.4);
        for(let i=0;i<12;i++){const t=i*Math.PI/6;a+=line([[53,80,43],[53+25*Math.cos(t),80,43+25*Math.sin(t)]],.6);}
        a+=cylX(42,46,53,43,4,steel);
        a+=rod([54,77,19],[52,80,19],1.8,steel);
        // vertical pump body + piston
        a+=box(7,10,5,40,39,10,dark);
        a+=cyl(25,24,10,79,7,m);
        a+=cyl(25,24,80,88+st.piston*17,4,steel);
        a+=rod([7,24,91+st.piston*17],[43,24,91+st.piston*17],4,dark);
        // hose passes between pump foot and wheel valve
        a+=line([[30,34,14],[42,46,5],[57,65,7],[55,80,20]],2.3);
        a+=circleFront(40,26,37,8,white,1.2);
        a+=circleFront(41,26,37,5,'#d9e6e8',.7);
        const angle=(-120+Math.min(1,st.pressure/5)*240)*Math.PI/180;
        a+=line([[42,26,37],[42,26+4*Math.cos(angle),37+4*Math.sin(angle)]],1.4);
        a+=frontLabel(42,27,30,st.pressure.toFixed(1),2.6);
        a+=tag([25,24,82],-57,-25,'PISTON',st.pumping);
        a+=tag([54,80,20],38,20,'VALVE',st.connected);
        a+=tag([40,26,37],-44,30,'PRESSION',st.connected);
        return a;
      }
      return {fig:'05',title:'Pompe à vélo',hint:'Raccorde la valve et observe la pression',size:[W,D,H],palette:'tomato',state:s,scene,
        idea:"À chaque descente du piston, l'air comprimé passe par un clapet vers le pneu.",
        readout:st=>(st.connected?'VALVE CONNECTÉE':'VALVE DÉCONNECTÉE')+' · '+st.pressure.toFixed(1)+' bar',
        stats:st=>[{label:'Pression illustrative',value:st.pressure.toFixed(1)+' bar'}],
        buttons:[
          {label:'Raccorder / retirer embout',onClick(st,ui){if(st.pumping)return ui.flash("Attends la fin du mouvement.");st.connected=!st.connected;}},
          {label:'Pomper',onClick(st,ui){if(!ensure(st.connected,ui,"Raccorde l'embout à la valve."))return;if(st.pumping)return;if(st.pressure>=4.5)return ui.flash("Limite pédagogique atteinte. Consulte la pression indiquée sur le pneu.");st.pumping=true;anim(ui,.65,p=>{st.piston=Math.sin(p*Math.PI);},()=>{st.pressure=Math.min(4.5,st.pressure+.3);st.pumping=false;st.piston=0;st.pumps++;});}},
          {label:'Réinitialiser',onClick(st,ui){if(st.pumping)return;st.pressure=.7;st.pumps=0;st.connected=false;}}
        ]};
    },
    coffee(){
      const s={water:0,grounds:false,coffee:0,brewing:false,progress:0};
      const W=79,D=83,H=115;
      function scene(st,m){
        let a=bench(W,D)+shadow(W,D,H);
        a+=housing(6,51,7,71,5,108,7,m);
        // reservoir glass on the front panel
        const tank=on(PX(51.5),rrUV(13,65,34,99,3));
        a+=shape(tank,'#d6eced',1.2);
        if(st.water>0)a+=clipTo(tank,waterWave(51.7,14,33,67+st.water*27,st.progress*10));
        a+=frontLabel(52,24,101,'H2O',3);
        // top lid, filter cone, visible ground bed
        a+=box(8,12,107,51,66,111,dark);
        a+=rod([44,52,87],[48,52,61],15,steel,toneI,1.1,7);
        if(st.grounds)a+=cyl(48,52,61,65,8,matOf('#8b5536'));
        // heating plate and transparent carafe
        a+=cyl(49,49,6,11,17,dark);
        a+=rod([49,49,12],[49,49,50],14,CLEAR,toneI,1.1,15);
        if(st.coffee>0)a+=cyl(49,49,13,13+st.coffee*25,13,matOf('#825332'));
        a+=rod([49,67,23],[61,70,29],3,dark);
        a+=cyl(49,49,48,51,12,steel);
        a+=circleFront(51.5,43,99,3,st.brewing?'#e34833':'#577b66');
        if(st.brewing){
          for(let i=0;i<4;i++){
            const z=58-((st.progress*50+i*5)%16);
            a+=cyl(48,49,z,z+1,1.15,blue);
          }
        }
        a+=tag([51,26,86],-52,-37,'RÉSERVOIR',st.water>0);
        a+=tag([48,52,62],50,-34,'FILTRE',st.grounds);
        a+=tag([49,49,30],46,28,'VERSEUSE',st.coffee>0);
        return a;
      }
      return {fig:'06',title:'Machine à café filtre',hint:"L'eau traverse le café moulu et s'écoule",size:[W,D,H],palette:'mint',state:s,scene,
        idea:"L'eau chauffée ruisselle sur le café moulu ; le filtre retient le marc pendant l'extraction.",
        readout:st=>st.brewing?'EXTRACTION · '+Math.round(st.progress*100)+' %':st.coffee>0?'CAFÉ PRÊT · '+Math.round(st.coffee*100)+' %':st.water>0&&st.grounds?'PRÊT À INFUSER':'AJOUTE EAU ET CAFÉ',
        buttons:[
          {label:"Ajouter de l'eau",onClick(st,ui){if(st.brewing)return ui.flash("Attends la fin de l'extraction.");st.water=1;}},
          {label:'Mettre le café moulu',onClick(st,ui){if(st.brewing)return ui.flash("Attends la fin de l'extraction.");st.grounds=true;}},
          {label:'Préparer le café',onClick(st,ui){if(!ensure(st.water>0&&st.grounds,ui,"Ajoute de l'eau et du café moulu."))return;if(st.brewing)return;st.brewing=true;st.progress=0;st.coffee=0;anim(ui,5.5,p=>{st.progress=p;st.water=1-p;st.coffee=p;},()=>{st.brewing=false;st.grounds=false;ui.flash("Extraction terminée : verseuse prête.");});}},
          {label:'Servir',onClick(st,ui){if(st.brewing)return ui.flash("Attends la fin de l'extraction.");if(st.coffee<=0)return ui.flash("La verseuse est vide.");st.coffee=0;ui.flash("Café servi.");}}
        ]};
    },
    flashlight(){
      const s={on:false,brightness:1,battery:1,open:false};
      const W=112,D=85,H=77;
      function scene(st,m){
        let a=bench(W,D);
        a+=shadow(95,70,65);
        // Beam is rendered behind the flashlight and its lens.
        if(st.on){
          const far=st.brightness===2?33:23;
          const cone=[[70,29,44],[W+far,1,6],[W+far,81,6],[70,52,57]];
          a+=fill(pd(cone),'#f7d65c','opacity="'+(st.brightness===2?'.28':'.18')+'"');
          a+=fill(pd(on(PZ(3),ellUV(105,48,31,23,36))),'#fff2a2','opacity=".35"');
        }
        // main battery tube and textured grip
        a+=cylX(14,73,40,45,12,m);
        a+=cylX(8,17,40,45,13,dark);
        for(let i=0;i<12;i++){
          const x=19+i*3.3;
          a+=line([[x,51,38],[x+1,51,52]],.55);
        }
        // switch above the handle
        a+=box(45,38,57,58,45,62,st.on?green:steel);
        // open tail to explain cell placement
        if(st.open)a+=cylX(3,13,40,45,14,steel);
        // front lens and its reflector
        a+=cylX(72,81,40,45,19,steel);
        a+=circleFront(81,40,45,15,st.on?'#fff5a1':'#d0e8e8',1.5);
        a+=circleFront(82,40,45,8,st.on?'#fff8c4':'#a9c9d0',.5);
        a+=tag([54,42,61],-40,-33,'INTERRUPTEUR',st.on);
        a+=tag([81,40,45],48,-30,'LED',st.on);
        a+=tag([24,52,43],-40,36,'BATTERIE',!st.open);
        return a;
      }
      return {fig:'07',title:'Lampe de poche',hint:'Ferme le circuit électrique pour éclairer',size:[W+34,D,H],palette:'cobalt',state:s,scene,
        idea:"La batterie alimente une LED quand l'interrupteur ferme le circuit ; la lentille dirige le faisceau.",
        readout:st=>st.open?'COMPARTIMENT PILES OUVERT':st.on?'LED ALLUMÉE · INTENSITÉ '+st.brightness:'CIRCUIT OUVERT · LAMPE ÉTEINTE',
        buttons:[
          {label:'Marche / arrêt',onClick(st,ui){if(st.open)return ui.flash("Referme le compartiment avant l'allumage.");st.on=!st.on;}},
          {label:'Intensité',choices:st=>[1,2].map(n=>({label:n===1?'Douce':'Forte',current:st.brightness===n,onClick(){st.brightness=n;}}))},
          {label:'Compartiment piles',onClick(st,ui){if(st.on)return ui.flash("Éteins la lampe avant d'ouvrir.");st.open=!st.open;ui.flash(st.open?"Compartiment ouvert.":"Compartiment refermé.");}}
        ]};
    }
  };
  window.startObjectFigure=(name)=>{
    if(!Object.hasOwn(DEF,name))throw Error('Unknown ColorFigure: '+name);
    window.__objectName=name;
    return run(DEF[name]());
  };
})();