const SPELL_CAST_HISTORY_LIMIT = 10;

const getRepeatingSpellRowId = sourceAttribute => {
    const match = sourceAttribute && sourceAttribute.match(/^repeating_spells_([^_]+)_/);
    return match ? match[1] : '';
};

const buildSpellActionName = (rowId, actionName) =>
    `repeating_spells_${rowId}_${actionName}`;

const buildSpellActionCall = (characterName, rowId, actionName) =>
    `%{${characterName}|${buildSpellActionName(rowId, actionName)}}`;

const explodeSpellDiceExpression = expression =>
    String(expression || '').replace(/(\d+d\d+)/gi, '$1!');

const parseSpellHistory = historyValue => {
    try {
        const parsed = JSON.parse(historyValue || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        log('Spell Cast History Parse', `Unable to parse spell cast history: ${error.message}`, deltaColor);
        return [];
    }
};

const hasBalancedParens = expression => {
    let depth = 0;
    for (const char of expression) {
        if (char === '(') {
            depth += 1;
        } else if (char === ')') {
            depth -= 1;
            if (depth < 0) {
                return false;
            }
        }
    }
    return depth === 0;
};

const isValidInlineRollExpression = expression => {
    const trimmedExpression = String(expression || '').trim();
    if (!trimmedExpression || !/\d/.test(trimmedExpression)) {
        return false;
    }
    if (/[{}\[\]|~"'`;:$]/.test(trimmedExpression)) {
        return false;
    }
    if (!hasBalancedParens(trimmedExpression)) {
        return false;
    }
    return /^[A-Za-z0-9dcsfkhlodr!<>=+\-*/%(),.\s?]+$/.test(trimmedExpression);
};

const buildLegendaryFailureAltFormula = (altDamage, specialDamage) => {
    const altExpression = String(altDamage || '').trim();
    const specialExpression = String(specialDamage || '').trim();
    if (!isValidInlineRollExpression(altExpression) || !isValidInlineRollExpression(specialExpression)) {
        return '';
    }

    const replaceableTerm = /(?:\d*d\d+[A-Za-z0-9!<>=]*\s*(?:[+\-]\s*\d+)*)/i;
    if (!replaceableTerm.test(altExpression)) {
        return altExpression;
    }
    return altExpression.replace(replaceableTerm, `(${specialExpression})`);
};

const syncSpellActionButtons = rowId => {
    if (!rowId) {
        return;
    }

    getAttrs(['character_name'], values => {
        const characterName = values.character_name || 'character_name';
        const setattrs = {};
        setattrs[`repeating_spells_${rowId}_spell-action-button-call`] = buildSpellActionCall(characterName, rowId, 'spellcast');
        setattrs[`repeating_spells_${rowId}_spell-whisper-action-button-call`] = buildSpellActionCall(characterName, rowId, 'whisper_spellcast');
        setAttrs(setattrs, { silent: true });
    });
};

const syncAllSpellActionButtons = () => {
    getSectionIDs('repeating_spells', ids => {
        ids.forEach(syncSpellActionButtons);
    });
};

const buildSpellDamageButtons = (rowId, castState, whisper = false) => {
    const baseAction = whisper ? 'whisper_spell' : 'spell';
    const buttonParts = [];

    if (castState.damage) {
        buttonParts.push(`{{damagebutton=[^{damage}](~${buildSpellActionName(rowId, `${baseAction}damage`)})}}`);
    }
    if (castState.altDamage) {
        buttonParts.push(`{{altdamagebutton=[^{damage-failed}](~${buildSpellActionName(rowId, `${baseAction}altdamage`)})}}`);
    }
    if (castState.specialDamage) {
        buttonParts.push(`{{specialdamagebutton=[^{special-damage-abbr}](~${buildSpellActionName(rowId, `${baseAction}specialdamage`)})}}`);
    }

    return buttonParts.join(' ');
};

const buildSpellDcButtonFields = (rowId, values, whisper = false) => {
    const buttonFields = [];
    ['dc1', 'dc2', 'dc3'].forEach(dcKey => {
        const castState = {
            damage: isValidInlineRollExpression(values[`repeating_spells_${rowId}_${dcKey}-damage`]) ? values[`repeating_spells_${rowId}_${dcKey}-damage`].trim() : '',
            altDamage: isValidInlineRollExpression(values[`repeating_spells_${rowId}_${dcKey}-alt-damage`]) ? values[`repeating_spells_${rowId}_${dcKey}-alt-damage`].trim() : '',
            specialDamage: isValidInlineRollExpression(values[`repeating_spells_${rowId}_${dcKey}-special-damage`]) ? values[`repeating_spells_${rowId}_${dcKey}-special-damage`].trim() : ''
        };
        const buttonString = buildSpellDamageButtons(rowId, castState, whisper);
        if (buttonString) {
            buttonFields.push(
                buttonString
                    .replace(/altdamagebutton/g, '__ALT_DAMAGE__')
                    .replace(/specialdamagebutton/g, '__SPECIAL_DAMAGE__')
                    .replace(/damagebutton/g, '__BASE_DAMAGE__')
                    .replace(/__BASE_DAMAGE__/g, `${dcKey}damagebutton`)
                    .replace(/__ALT_DAMAGE__/g, `${dcKey}altdamagebutton`)
                    .replace(/__SPECIAL_DAMAGE__/g, `${dcKey}specialdamagebutton`)
            );
        }
    });
    return buttonFields.length ? `{{buttons=1}} ${buttonFields.join(' ')}` : '';
};

const getSpellCastState = (values, rowId, originalRollId) => {
    const history = parseSpellHistory(values[`repeating_spells_${rowId}_spell-cast-history`]);
    const matchedRoll = originalRollId ? history.find(entry => entry.rollId === originalRollId) : null;
    if (matchedRoll) {
        return matchedRoll;
    }
    const lastRollId = values[`repeating_spells_${rowId}_spell-last-cast-rollid`];
    return lastRollId ? history.find(entry => entry.rollId === lastRollId) || null : null;
};

const storeSpellCastState = (rowId, values, state) => {
    const historyField = `repeating_spells_${rowId}_spell-cast-history`;
    const history = parseSpellHistory(values[historyField]);
    const nextHistory = [
        state,
        ...history.filter(entry => entry && entry.rollId && entry.rollId !== state.rollId)
    ].slice(0, SPELL_CAST_HISTORY_LIMIT);

    const setattrs = {};
    setattrs[historyField] = JSON.stringify(nextHistory);
    setattrs[`repeating_spells_${rowId}_spell-last-cast-rollid`] = state.rollId;
    setAttrs(setattrs, { silent: true });
};

const restoreAllSpellSlots = () => {
    getSectionIDs('repeating_spells', ids => {
        const maxFields = ids.map(id => `repeating_spells_${id}_spell-slot_max`);
        getAttrs(maxFields, values => {
            const setattrs = {};
            ids.forEach(id => {
                const maxField = `repeating_spells_${id}_spell-slot_max`;
                setattrs[`repeating_spells_${id}_spell-slot`] = values[maxField] || 0;
            });
            setAttrs(setattrs, { silent: true });
        });
    });
};

const showNoSpellSlotsPopup = (characterName, spellName) => {
    startRoll(
        `!&{template:roll} {{name=${characterName}}} {{title=${spellName}}} {{roll=[[0]]}} {{notes=?{No spell slots remain for ${spellName}.|OK}}}`,
        results => finishRoll(results.rollId)
    );
};

const runSpellCast = whisper => eventInfo => {
    const rowId = getRepeatingSpellRowId(eventInfo.sourceAttribute);
    if (!rowId) {
        return;
    }

    syncSpellActionButtons(rowId);

    const fields = [
        'character_name',
        'condition',
        'mana-tap_bonus',
        `repeating_spells_${rowId}_spell`,
        `repeating_spells_${rowId}_spell-school`,
        `repeating_spells_${rowId}_spell-tier`,
        `repeating_spells_${rowId}_spell-casting-time`,
        `repeating_spells_${rowId}_spell-range`,
        `repeating_spells_${rowId}_spell-duration`,
        `repeating_spells_${rowId}_spell-effect`,
        `repeating_spells_${rowId}_spell-effect2`,
        `repeating_spells_${rowId}_spell-effect3`,
        `repeating_spells_${rowId}_spell-special`,
        `repeating_spells_${rowId}_spell-dc1`,
        `repeating_spells_${rowId}_spell-dc2`,
        `repeating_spells_${rowId}_spell-dc3`,
        `repeating_spells_${rowId}_dc1-damage`,
        `repeating_spells_${rowId}_dc1-alt-damage`,
        `repeating_spells_${rowId}_dc1-special-damage`,
        `repeating_spells_${rowId}_dc2-damage`,
        `repeating_spells_${rowId}_dc2-alt-damage`,
        `repeating_spells_${rowId}_dc2-special-damage`,
        `repeating_spells_${rowId}_dc3-damage`,
        `repeating_spells_${rowId}_dc3-alt-damage`,
        `repeating_spells_${rowId}_dc3-special-damage`,
        `repeating_spells_${rowId}_spell-slot`,
        `repeating_spells_${rowId}_spell-slot_max`,
        `repeating_spells_${rowId}_spell-cast-history`
    ];

    getAttrs(fields, values => {
        const characterName = values.character_name || 'Character';
        const spellName = values[`repeating_spells_${rowId}_spell`] || 'Spell';
        const spellSlots = parseInt(values[`repeating_spells_${rowId}_spell-slot`], 10) || 0;
        const manaTapBonus = parseInt(values['mana-tap_bonus'], 10) || 0;
        const condition = parseSignedValue(values.condition);
        const whisperPrefix = whisper ? '/w gm ' : '';

        if (spellSlots <= 0) {
            showNoSpellSlotsPopup(characterName, spellName);
            return;
        }

        setAttrs({
            [`repeating_spells_${rowId}_spell-slot`]: spellSlots - 1
        }, { silent: true });

        const spellSchool = values[`repeating_spells_${rowId}_spell-school`] || 'evocation';
        const spellTier = values[`repeating_spells_${rowId}_spell-tier`] || '';
        const castingTime = values[`repeating_spells_${rowId}_spell-casting-time`] || '';
        const spellRange = values[`repeating_spells_${rowId}_spell-range`] || '';
        const spellDuration = values[`repeating_spells_${rowId}_spell-duration`] || '';
        const effect1 = values[`repeating_spells_${rowId}_spell-effect`] || '';
        const effect2 = values[`repeating_spells_${rowId}_spell-effect2`] || '';
        const effect3 = values[`repeating_spells_${rowId}_spell-effect3`] || '';
        const special = values[`repeating_spells_${rowId}_spell-special`] || '';
        const dc1 = parseInt(values[`repeating_spells_${rowId}_spell-dc1`], 10) || 0;
        const dc2 = parseInt(values[`repeating_spells_${rowId}_spell-dc2`], 10) || 0;
        const dc3 = parseInt(values[`repeating_spells_${rowId}_spell-dc3`], 10) || 0;

        const spellButtons = buildSpellDcButtonFields(rowId, values, whisper);
        const rollTemplate = `${whisperPrefix}&{template:roll} {{spellcast=roll}} {{name=${characterName}}} {{title=${spellName}}} {{school=^{${spellSchool}}}} {{tier=${spellTier}}} {{castingtime=${castingTime}}} {{range=${spellRange}}} {{duration=${spellDuration}}} {{roll=[[1d20cs>20cf<2 + ${manaTapBonus}[^{mana-tap}] + ${condition}[Condition] + @{multi-action-penalty}[^{multi-action-penalty}] + ?{Additional Modifiers|0}[Modifier]]]}} {{target=[[?{DC|${dc1}|${dc2}|${dc3}}]]}} {{raises=[[0]]}} {{legendary-point=?{Spend a Legendary Point|No,[[0]]|Yes,[[1]]}}} {{effect1=${effect1}}} {{effect2=${effect2}}} {{effect3=${effect3}}} {{special=${special}}} {{dc1=[[${dc1}]]}} {{dc2=[[${dc2}]]}} {{dc3=[[${dc3}]]}} ${spellButtons}`;

        startRoll(rollTemplate, results => {
            const naturalRoll = (results.results.roll.dice && results.results.roll.dice[0]) || 0;
            const target = parseInt(results.results.target.result, 10) || 0;
            const legendaryPoint = parseInt(results.results['legendary-point'].result, 10) || 0;
            const totalRoll = parseInt(results.results.roll.result, 10) || 0;
            const success = naturalRoll === 20 || totalRoll >= target ? 1 : 0;
            const raises = success ? Math.max(0, Math.floor((totalRoll - target) / 5)) : 0;
            const selectedDcKey = target === dc1 ? 'dc1' : target === dc2 ? 'dc2' : 'dc3';
            const damage = values[`repeating_spells_${rowId}_${selectedDcKey}-damage`] || '';
            const altDamage = values[`repeating_spells_${rowId}_${selectedDcKey}-alt-damage`] || '';
            const specialDamage = values[`repeating_spells_${rowId}_${selectedDcKey}-special-damage`] || '';
            const legendaryFailureAltDamage = legendaryPoint && !success
                ? buildLegendaryFailureAltFormula(altDamage, specialDamage)
                : '';

            const castState = {
                rollId: results.rollId,
                damage: isValidInlineRollExpression(damage) ? damage.trim() : '',
                altDamage: isValidInlineRollExpression(legendaryFailureAltDamage || altDamage)
                    ? String(legendaryFailureAltDamage || altDamage).trim()
                    : '',
                specialDamage: isValidInlineRollExpression(specialDamage) ? specialDamage.trim() : '',
                legendaryPoint,
                selectedDcKey,
                success,
                naturalRoll,
                raises
            };

            storeSpellCastState(rowId, values, castState);

            if (naturalRoll === 20) {
                restoreAllSpellSlots();
            }

            finishRoll(results.rollId, {
                raises
            });
        });
    });
};

const runSpellDamage = ({ whisper = false, damageType = 'damage' } = {}) => eventInfo => {
    const rowId = getRepeatingSpellRowId(eventInfo.sourceAttribute);
    if (!rowId) {
        return;
    }

    const fields = [
        'character_name',
        `repeating_spells_${rowId}_spell`,
        `repeating_spells_${rowId}_spell-cast-history`,
        `repeating_spells_${rowId}_spell-last-cast-rollid`
    ];

    getAttrs(fields, values => {
        const castState = getSpellCastState(values, rowId, eventInfo.originalRollId);
        if (!castState) {
            return;
        }

        const characterName = values.character_name || 'Character';
        const spellName = values[`repeating_spells_${rowId}_spell`] || 'Spell';
        const whisperPrefix = whisper ? '/w gm ' : '';
        const baseFormula = damageType === 'altDamage'
            ? castState.altDamage
            : damageType === 'specialDamage'
                ? castState.specialDamage
                : castState.damage;
        const raises = Math.max(0, parseInt(castState.raises, 10) || 0);
        const crit = (parseInt(castState.naturalRoll, 10) || 0) === 20;

        if (damageType === 'specialDamage' && !castState.legendaryPoint) {
            return;
        }
        if (!isValidInlineRollExpression(baseFormula)) {
            return;
        }

        const rollTerms = [
            crit ? explodeSpellDiceExpression(baseFormula) : baseFormula
        ];

        if (damageType !== 'altDamage' && raises > 0) {
            rollTerms.push(`${raises}d6${crit ? '!' : ''} [Additional d6s per raise]`);
        }

        const formula = rollTerms.join(' + ');

        startRoll(
            `${whisperPrefix}&{template:roll} {{name=${characterName}}} {{title=${spellName}}} {{damageroll=yes}} {{normaldamage=yes}} {{dmg=[[${formula}]]}}`,
            results => finishRoll(results.rollId)
        );
    });
};

on('sheet:opened', syncAllSpellActionButtons);
on('change:character_name', syncAllSpellActionButtons);
on('change:repeating_spells:spell', eventInfo => {
    syncSpellActionButtons(getRepeatingSpellRowId(eventInfo.sourceAttribute));
});

on('clicked:repeating_spells:spellcast', runSpellCast(false));
on('clicked:repeating_spells:whisper_spellcast', runSpellCast(true));
on('clicked:repeating_spells:spelldamage', runSpellDamage({ damageType: 'damage' }));
on('clicked:repeating_spells:spellaltdamage', runSpellDamage({ damageType: 'altDamage' }));
on('clicked:repeating_spells:spellspecialdamage', runSpellDamage({ damageType: 'specialDamage' }));
on('clicked:repeating_spells:whisper_spelldamage', runSpellDamage({ whisper: true, damageType: 'damage' }));
on('clicked:repeating_spells:whisper_spellaltdamage', runSpellDamage({ whisper: true, damageType: 'altDamage' }));
on('clicked:repeating_spells:whisper_spellspecialdamage', runSpellDamage({ whisper: true, damageType: 'specialDamage' }));
