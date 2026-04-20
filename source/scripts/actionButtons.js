const WEAPON_ATTACK_HISTORY_LIMIT = 10;

const getRepeatingRowId = sourceAttribute => {
    const match = sourceAttribute && sourceAttribute.match(/^repeating_weapons_([^_]+)_/);
    return match ? match[1] : '';
};

const toInt = value => parseInt(value, 10) || 0;

const parseSignedValue = value => {
    if (value === undefined || value === null) {
        return 0;
    }
    return parseInt(String(value).split(' ')[0], 10) || 0;
};

const explodeDiceExpression = expression =>
    String(expression || '').replace(/(\d+d\d+)/gi, '$1!');

const getWeaponActionName = (rowId, actionName) =>
    `repeating_weapons_${rowId}_${actionName}`;

const buildWeaponActionCall = (characterName, rowId, actionName) =>
    `%{${characterName}|${getWeaponActionName(rowId, actionName)}}`;

const getWeaponDamageModifierLabel = modifierName => {
    const labelMap = {
        strength_modifier: '^{strength-mod}',
        strength_modifier_x2: '^{strength-x2-mod}',
        dexterity_modifier: '^{dexterity-mod}',
        dexterity_modifier_x2: '^{dexterity-x2-mod}',
        constitution_modifier: '^{constitution-mod}',
        intelligence_modifier: '^{intelligence-mod}',
        wisdom_modifier: '^{wisdom-mod}',
        charisma_modifier: '^{charisma-mod}'
    };

    return labelMap[modifierName] || '^{attribute-modifier}';
};

const buildWeaponDamageButtons = (rowId, whisper = false) => {
    const damageAction = whisper ? 'weaponwhisperdamage' : 'weapondamage';
    const critDamageAction = whisper ? 'weaponwhispercriticaldamage' : 'weaponcriticaldamage';
    return `{{buttons=1}} {{damagebutton=[Normal Damage](~${getWeaponActionName(rowId, damageAction)})}} {{criticaldamagebutton=[Critical Damage](~${getWeaponActionName(rowId, critDamageAction)})}}`;
};

const parseAttackHistory = historyValue => {
    try {
        const parsed = JSON.parse(historyValue || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        log('Weapon Attack History Parse', `Unable to parse attack history: ${error.message}`, deltaColor);
        return [];
    }
};

const syncWeaponActionButtons = rowId => {
    if (!rowId) {
        return;
    }

    getAttrs(['character_name'], values => {
        const characterName = values.character_name || 'character_name';
        const setattrs = {};
        setattrs[`repeating_weapons_${rowId}_weapon-attack-action-call`] = buildWeaponActionCall(characterName, rowId, 'weaponattack');
        setattrs[`repeating_weapons_${rowId}_weapon-whisper-attack-action-call`] = buildWeaponActionCall(characterName, rowId, 'weaponwhisperattack');
        setattrs[`repeating_weapons_${rowId}_damage_button`] = buildWeaponDamageButtons(rowId);
        setattrs[`repeating_weapons_${rowId}_whisper_damage_button`] = buildWeaponDamageButtons(rowId, true);
        setAttrs(setattrs, { silent: true });
    });
};

const syncAllWeaponActionButtons = () => {
    getSectionIDs('repeating_weapons', ids => {
        ids.forEach(syncWeaponActionButtons);
    });
};

const getAttackStateForRoll = (values, rowId, originalRollId) => {
    const history = parseAttackHistory(values[`repeating_weapons_${rowId}_weapon-attack-history`]);
    const matchedRoll = originalRollId ? history.find(entry => entry.rollId === originalRollId) : null;

    return matchedRoll || {
        rollId: values[`repeating_weapons_${rowId}_weapon-last-attack-rollid`] || '',
        success: toInt(values[`repeating_weapons_${rowId}_weapon-last-attack-success`]),
        crit: toInt(values[`repeating_weapons_${rowId}_weapon-last-attack-crit`]),
        raises: toInt(values[`repeating_weapons_${rowId}_weapon-last-attack-raises`]),
        total: toInt(values[`repeating_weapons_${rowId}_weapon-last-attack-total`]),
        natural: toInt(values[`repeating_weapons_${rowId}_weapon-last-attack-natural`]),
        target: toInt(values[`repeating_weapons_${rowId}_weapon-last-attack-target`])
    };
};

const storeAttackState = (rowId, values, state) => {
    const historyField = `repeating_weapons_${rowId}_weapon-attack-history`;
    const history = parseAttackHistory(values[historyField]);
    const nextHistory = [
        state,
        ...history.filter(entry => entry && entry.rollId && entry.rollId !== state.rollId)
    ].slice(0, WEAPON_ATTACK_HISTORY_LIMIT);

    const setattrs = {};
    setattrs[historyField] = JSON.stringify(nextHistory);
    setattrs[`repeating_weapons_${rowId}_weapon-last-attack-rollid`] = state.rollId;
    setattrs[`repeating_weapons_${rowId}_weapon-last-attack-success`] = state.success;
    setattrs[`repeating_weapons_${rowId}_weapon-last-attack-crit`] = state.crit;
    setattrs[`repeating_weapons_${rowId}_weapon-last-attack-raises`] = state.raises;
    setattrs[`repeating_weapons_${rowId}_weapon-last-attack-total`] = state.total;
    setattrs[`repeating_weapons_${rowId}_weapon-last-attack-natural`] = state.natural;
    setattrs[`repeating_weapons_${rowId}_weapon-last-attack-target`] = state.target;
    setAttrs(setattrs, { silent: true });
};

const runWeaponAttack = whisper => eventInfo => {
    const rowId = getRepeatingRowId(eventInfo.sourceAttribute);
    if (!rowId) {
        return;
    }

    syncWeaponActionButtons(rowId);

    const fields = [
        'character_name',
        'condition',
        `repeating_weapons_${rowId}_weapon`,
        `repeating_weapons_${rowId}_weapon-atk`,
        `repeating_weapons_${rowId}_weapon-crit`,
        `repeating_weapons_${rowId}_weapon-attack-history`
    ];

    getAttrs(fields, values => {
        const characterName = values.character_name || 'Character';
        const weaponName = values[`repeating_weapons_${rowId}_weapon`] || 'Weapon';
        const attackBonus = toInt(values[`repeating_weapons_${rowId}_weapon-atk`]);
        const critThreshold = Math.max(2, toInt(values[`repeating_weapons_${rowId}_weapon-crit`]) || 20);
        const critPoint = critThreshold - 1;
        const condition = parseSignedValue(values.condition);
        const whisperPrefix = whisper ? '/w gm ' : '';
        const damageButtons = buildWeaponDamageButtons(rowId, whisper);
        const rollTemplate = `${whisperPrefix}&{template:roll} {{name=${characterName}}} {{title=${weaponName}}} {{roll=[[1d20cs>${critPoint}cf<2 + ${attackBonus}[ATK] + ${condition}[Condition] + @{multi-action-penalty}[^{multi-action-penalty}] + ?{Additional Modifiers|0}[Modifier Pop-up]]]}} {{target=[[?{Target Defense Score|10}]]}} {{raises=[[0]]}} ${damageButtons}`;

        startRoll(rollTemplate, results => {
            const naturalRoll = (results.results.roll.dice && results.results.roll.dice[0]) || 0;
            const totalRoll = toInt(results.results.roll.result);
            const target = toInt(results.results.target.result);
            const crit = naturalRoll >= critThreshold ? 1 : 0;
            const success = crit || totalRoll >= target ? 1 : 0;
            const raises = success ? Math.max(0, Math.floor((totalRoll - target) / 5)) : 0;

            storeAttackState(rowId, values, {
                rollId: results.rollId,
                crit,
                success,
                raises,
                total: totalRoll,
                natural: naturalRoll,
                target
            });

            finishRoll(results.rollId, {
                raises
            });
        });
    });
};

const runWeaponDamage = ({ whisper = false, forceCrit = false } = {}) => eventInfo => {
    const rowId = getRepeatingRowId(eventInfo.sourceAttribute);
    if (!rowId) {
        return;
    }

    const fields = [
        'character_name',
        `repeating_weapons_${rowId}_weapon`,
        `repeating_weapons_${rowId}_weapon-damage-dice`,
        `repeating_weapons_${rowId}_weapon-half-level`,
        `repeating_weapons_${rowId}_weapon-damage-attribute-mod`,
        `repeating_weapons_${rowId}_damage-attribute-mod-value`,
        `repeating_weapons_${rowId}_weapon-damage-misc-mod`,
        `repeating_weapons_${rowId}_weapon-attack-history`,
        `repeating_weapons_${rowId}_weapon-last-attack-rollid`,
        `repeating_weapons_${rowId}_weapon-last-attack-success`,
        `repeating_weapons_${rowId}_weapon-last-attack-crit`,
        `repeating_weapons_${rowId}_weapon-last-attack-raises`,
        `repeating_weapons_${rowId}_weapon-last-attack-total`,
        `repeating_weapons_${rowId}_weapon-last-attack-natural`,
        `repeating_weapons_${rowId}_weapon-last-attack-target`
    ];

    getAttrs(fields, values => {
        const attackState = getAttackStateForRoll(values, rowId, eventInfo.originalRollId);
        const crit = forceCrit || !!attackState.crit;
        const raises = Math.max(0, toInt(attackState.raises));
        const weaponName = values[`repeating_weapons_${rowId}_weapon`] || 'Weapon';
        const characterName = values.character_name || 'Character';
        const damageDice = values[`repeating_weapons_${rowId}_weapon-damage-dice`] || '';
        const damageAttributeModName = values[`repeating_weapons_${rowId}_weapon-damage-attribute-mod`] || 'Damage Attribute';
        const damageAttributeModValue = toInt(values[`repeating_weapons_${rowId}_damage-attribute-mod-value`]);
        const damageMiscMod = toInt(values[`repeating_weapons_${rowId}_weapon-damage-misc-mod`]);
        const halfLevel = toInt(values[`repeating_weapons_${rowId}_weapon-half-level`]);
        const whisperPrefix = whisper ? '/w gm ' : '';
        const rollTerms = [];

        if (checkDiceExpression(damageDice)) {
            rollTerms.push(`${crit ? explodeDiceExpression(damageDice) : damageDice} [Weapon Damage]`);
        }

        if (halfLevel) {
            rollTerms.push(`${halfLevel} [half-level]`);
        }
        if (damageAttributeModName && damageAttributeModName !== '0' && damageAttributeModName !== 'none') {
            rollTerms.push(`${damageAttributeModValue} [${getWeaponDamageModifierLabel(damageAttributeModName)}]`);
        }
        if (damageMiscMod) {
            rollTerms.push(`${damageMiscMod} [Misc Mod]`);
        }
        if (crit) {
            rollTerms.push('1d6! [Crit d6]');
        }
        if (raises > 0) {
            rollTerms.push(`${raises}d6${crit ? '!' : ''} [Additional d6s per raise]`);
        }

        //const rollFormula = rollTerms.length ? rollTerms.join(' + ') : '0';
        let rollFormula = rollTerms.length ? rollTerms.join(' + ') : '0';
        rollFormula += " + ?{Additional Damage Mod|0}[Additional Mod]";

        startRoll(
            `${whisperPrefix}&{template:roll} {{name=${characterName}}} {{title=${weaponName}}} {{weaponname=${weaponName}}} {{damageroll=yes}} {{critdamage=${crit ? 'yes' : ''}}} {{normaldamage=${crit ? '' : 'yes'}}} {{dmg=[[${rollFormula}]]}}`,
            results => finishRoll(results.rollId)
        );
    });
};

on('sheet:opened', syncAllWeaponActionButtons);
on('change:character_name', syncAllWeaponActionButtons);
on('change:repeating_weapons:weapon', eventInfo => {
    syncWeaponActionButtons(getRepeatingRowId(eventInfo.sourceAttribute));
});

on('clicked:repeating_weapons:weaponattack', runWeaponAttack(false));
on('clicked:repeating_weapons:weaponwhisperattack', runWeaponAttack(true));
on('clicked:repeating_weapons:weapondamage', runWeaponDamage());
on('clicked:repeating_weapons:weaponcriticaldamage', runWeaponDamage({ forceCrit: true }));
on('clicked:repeating_weapons:weaponwhisperdamage', runWeaponDamage({ whisper: true }));
on('clicked:repeating_weapons:weaponwhispercriticaldamage', runWeaponDamage({ whisper: true, forceCrit: true }));

// Second Wind
on('clicked:secondwind', function() {
    getAttrs(['character_name', 'constitution','stamina_max', 'stamina'], values => {
        const characterName = values.character_name || 'Character';
        const constitutionModifier = toInt(values.constitution);
        const staminaMax = toInt(values.stamina_max);
        const quarterStamina = Math.floor(staminaMax / 4);
        const staminaCurrent = toInt(values.stamina);
        let gain = Math.max(quarterStamina, constitutionModifier);
        log("Second Wind Activated", `Constitution Modifier: ${constitutionModifier}, Stamina Max: ${staminaMax} (max possible = ${quarterStamina}), Current Stamina: ${staminaCurrent}, Stamina Gain: ${gain}`, r20color);
        const gapToMax = staminaMax - staminaCurrent;
        if (gain > gapToMax) {
            gain = gapToMax;
        }
        const newCurrent = Math.min(staminaMax, staminaCurrent + gain);
        setAttrs({ stamina: newCurrent });
        const roll_result = `/w gm &{template:roll} {{name=${characterName}}} {{title=Second Wind}} {{secondwind=[[${gain}]]}}`;
        startRoll(roll_result, results => finishRoll(results.rollId));
    });
});
