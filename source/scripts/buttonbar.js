/* ---- Button Bar Clicks ---- */
const buttonlist = [
    'pureStrainHuman_1',
    'humanoid_2',
    'mutantAnimal_3',
    'notes_4',
    'releaseNotes_5',
    'sheetDocumentation_6',
    'characterSheet_7',
    'npc_8',
    'gmScreen_99'
];

buttonlist.forEach(button => {
    on(`clicked:${button}`, function () {

        let setattr = {};
        log('Button Bar Button', `${button} button was clicked!!`, buttonClick);
        let radioval = `${button}`;
        //radioval = radioval.slice(-1);
        radioval = radioval.split('_');
        setattr['sheetTab'] = radioval[1];
        getAttrs(['characterIsNpc'], function (v) {

            if (radioval[1] === '1' || radioval[1] === '2' || radioval[1] === '3') {
                setattr['characterType'] = radioval[1];
            }
            else if (radioval[1] === '8') {
                console.log('Toggling NPC status');
                console.log('characterIsNpc:', v.characterIsNpc);
                if (v.characterIsNpc === '0') {
                    setattr['characterIsNpc'] = '1';
                } else {
                    setattr['characterIsNpc'] = '0';
                }
            }
            else if (radioval[1] === '5') {
                setattr['newcontent'] = 'read';
            } else if (radioval[1] === '6') {
                setattr['newdocumentation'] = 'read';
            }
            console.log(setattr);
            setAttrs(setattr);
        });
    });
});