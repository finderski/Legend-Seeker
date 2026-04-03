//Calculate Half-Level
on('change:level', function(eventInfo) {
    const halfLevelValue = Math.floor((parseInt(eventInfo.newValue)/2 || 0));
    const setattrs = {};
    setattrs['half-level'] = halfLevelValue;
    setAttrs(setattrs);
});

/*------------------Update Skill Bonuses------------------*/
// Watch for updates to: Attribute Modifiers, Half-Level, Trained Status, Skill Focus and Misc. Modifiers
const listOfSklls = ['acrobatics','climb','craft','deception','endurance','gather-information','initiative','invoke-arcana','jump','lore','notice','persuasion','ride','sense-motive','stealth','survival','swim','tinkering','treat-wounds','mana-tap'];
const listOfAttributes = ['strength_modifier', 'dexterity_modifier', 'constitution_modifier', 'intelligence_modifier', 'wisdom_modifier', 'charisma_modifier'];

/*------------------End Skill Bonsuses------------------*/

