const actor = args[0].actor;
const token = actor.getActiveTokens()[0];

let hookId = actor.getFlag("world", "santana_regalia_0_hook");
console.log("Current hook ID: " + hookId)

// Reset the damage done
actor.setFlag("world", "santana_regalia_0_damage", 0);

// Clear the orbs
let numOrbs = actor.getFlag("world", "santana_regalia_0_orbs");
if (numOrbs) {
  for (let i = 0; i < 4; i++) {
    Sequencer.EffectManager.endEffects({
      name: `santana_orb_${i}`,
      object: token.id,
    });
  }
} else {
  // Initialize the numOrbs
  actor.setFlag("world", "santana_regalia_0_orbs", 0);
}
numOrbs = 0;

const hookRegistered = Hooks.events['midi-qol.DamageRollComplete'].some(hook => hook.id == hookId)
// Hook was unregistered - reregister it
if(!hookRegistered) {
  hookId = null
  actor.setFlag("world", "santana_regalia_0_hook", null);
}

if (!hookId) {
  // No hook ID, register the hook
  console.log("Registering new hook");
  hookId = Hooks.on("midi-qol.DamageRollComplete", async (workflow) => {
    console.dir(workflow);
    if (workflow.actor.name === actor.name) {
      if (workflow.damageTotal && workflow.hitTargets.size > 0) {
        // Dealt damage, accumulate the result
        let currentDamage = actor.getFlag("world", "santana_regalia_0_damage");
        console.log(`Current damage: ${currentDamage}`)
        let newDamage = workflow.healingAdjustedDamageTotal
        console.log(`New damage: ${newDamage}`)
        if(newDamage > 0) {
          currentDamage += newDamage
        }
        console.log(`Updated damage: ${currentDamage}`)
        actor.setFlag("world", "santana_regalia_0_damage", currentDamage);

        // Update the orbs
        numOrbs = actor.getFlag("world", "santana_regalia_0_orbs");
        for (let i = 0; i < numOrbs; i++) {
          Sequencer.EffectManager.endEffects({
            name: `santana_orb_${i}`,
            object: token.id,
          });
        }
        numOrbs = Math.floor(currentDamage / 10);
        let orbIndicies = numOrbs;
        if (orbIndicies > 4) {
          orbIndicies = 4;
        }

        const offsets = [
          { x: 100, y: 0 },
          { x: 0, y: -100 },
          { x: -100, y: 0 },
          { x: 0, y: 100 },
        ];
        const files = [
          "jb2a.markers.light_orb.loop.yellow",
          "jb2a.markers.light_orb.loop.green",
          "jb2a.markers.light_orb.loop.blue",
          "jb2a.markers.light_orb.loop.white",
        ];
        for (let orbIndex = 0; orbIndex < orbIndicies; orbIndex++) {
          let newOrb = new Sequence()
            .effect()
            .file(files[orbIndex])
            .attachTo(token.id, { offset: offsets[orbIndex] })
            .scale(0.5)
            .persist()
            .name(`santana_orb_${orbIndex}`)
            .fadeIn(500)
            .fadeOut(500)
            .play();
        }
        actor.setFlag("world", "santana_regalia_0_orbs", numOrbs);

        // Send the notification
        const message = `${actor.name} has dealt ${currentDamage} damage this turn and has ${numOrbs} orbs`;
        ChatMessage.create({
          user: game.user_id,
          speaker: ChatMessage.getSpeaker({ actor: game.user.character }),
          content: message,
        });
      }
    }
  });
  actor.setFlag("world", "santana_regalia_0_hook", hookId);
  console.log(hookId);
}
