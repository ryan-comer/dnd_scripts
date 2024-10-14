const actor = args[0].actor;
const token = actor.getActiveTokens()[0];

function healing(numOrbs) {
  const healingAmount = 4 * numOrbs; // The amount of healing to apply

  new MidiQOL.DamageOnlyWorkflow(
    actor,
    token,
    healingAmount,
    "healing",
    [token],
    new Roll(healingAmount.toString()),
    {
      flavor: `Healing`,
    }
  );

  // Create the healing effect
  new Sequence()
    .effect()
    .file('jb2a.healing_generic.200px.green')
    .atLocation(token)
    .play()

  const chatMessage = `${token.name} is healed for ${healingAmount} HP!`;
  ChatMessage.create({ content: chatMessage });
}

function damage() {}

function clearOrbs(numOrbs) {
  for (let i = 0; i < numOrbs; i++) {
    Sequencer.EffectManager.endEffects({
      name: `santana_orb_${i}`,
      object: token.id,
    });
  }

  actor.setFlag("world", "santana_regalia_0_damage", 0);
  actor.setFlag("world", "santana_regalia_0_orbs", 0);
}

// Get the number of orbs
let numOrbs = actor.getFlag("world", "santana_regalia_0_orbs");
if (numOrbs && numOrbs > 0) {
  new Dialog({
    title: "Orbs",
    content: `<p>How do you want to spend your orbs?:</p>`,
    buttons: {
      option1: {
        label: "Damage",
        callback: () => {
          damage(numOrbs);
          clearOrbs(numOrbs);
        },
      },
      option2: {
        label: "Healing",
        callback: () => {
          healing(numOrbs);
          clearOrbs(numOrbs);
        },
      },
    },
    default: "option1",
  }).render(true);
}
