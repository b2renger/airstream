
const ASSET_CONFIG = [
    { name: 'Layer A', folder: 'layerA', images: ['A1A1.png', 'A1A2.png', 'A1A3.png', 'A1A4.png', 'A1A5.png'], sounds: ['A1A1.mp3', 'A1A2.mp3', 'A1A3.mp3', 'A1A4.mp3', 'A1A5.mp3'] },
    { name: 'Layer D', folder: 'layerD', images: ['A1D1.png', 'A1D2.png', 'A1D3.png', 'A1D4.png', 'A1D5.png'], sounds: ['A1D1.mp3', 'A1D2.mp3', 'A1D3.mp3', 'A1D4.mp3', 'A1D5.mp3'] },
    { name: 'Layer G', folder: 'layerG', images: ['A1G1.png', 'A1G2.png', 'A1G3.png', 'A1G4.png', 'A1G5.png'], sounds: ['A1G1.mp3', 'A1G2.mp3', 'A1G3.mp3', 'A1G4.mp3', 'A1G5.mp3'] },
    { name: 'Layer R', folder: 'layerR', images: ['A1R1.png', 'A1R2.png', 'A1R3.png', 'A1R4.png', 'A1R5.png'], sounds: ['A1R1.mp3', 'A1R2.mp3', 'A1R3.mp3', 'A1R4.mp3', 'A1R5.mp3'] },
    { name: 'Layer V', folder: 'layerV', images: ['A1V1.png', 'A1V2.png', 'A1V3.png', 'A1V4.png', 'A1V5.png'], sounds: ['A1V1.mp3', 'A1V2.mp3', 'A1V3.mp3', 'A1V4.mp3', 'A1V5.mp3'] }
];
const NUM_VISUAL_LAYERS = 5;


let allImages = [];
let allSounds = [];
let composition = { layers: [] };
let gui;
let isReadyToStart = false;
const P5_BLEND_MODES = ['BLEND', 'ADD', 'DARKEST', 'LIGHTEST', 'DIFFERENCE', 'EXCLUSION', 'MULTIPLY', 'SCREEN', 'OVERLAY', 'HARD_LIGHT', 'SOFT_LIGHT', 'DODGE', 'BURN'];

function preload() {
    console.log("Début du pré-chargement des assets...");
    ASSET_CONFIG.forEach(layerConfig => {
        layerConfig.images.forEach(filename => {
            let path = `assets/${layerConfig.folder}/img/${filename}`;
            allImages.push(loadImage(path));
        });
        layerConfig.sounds.forEach(filename => {
            let path = `assets/${layerConfig.folder}/snd/${filename}`;
            allSounds.push(loadSound(path));
        });
    });
   // console.log(allSounds)
    console.log(`Pré-chargement terminé ! ${allImages.length} images et ${allSounds.length} sons chargés.`);
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    
    for (let i = 0; i < NUM_VISUAL_LAYERS; i++) {
        composition.layers.push({
            currentImage: null, currentSound: null,
            volume: 0.8, opacity: 150, blendMode: 'BLEND'
        });
    }

    setupGUI();
    isReadyToStart = true;
    
    background(0);
    fill(255);
    textAlign(CENTER, CENTER);
    //textSize(24);
    //text("Générateur Audiovisuel", width / 2, height / 2 - 20);
    textSize(24);
    text("Cliquez pour commencer", width / 2, height / 2 + 20);
}

function mousePressed() {
    if (!isReadyToStart) return;
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
       
        const audioContext = getAudioContext();
        if (audioContext.state !== 'running') {
            audioContext.resume().then(() => {
              //  console.log('AudioContext a été relancé avec succès ! État :', audioContext.state);
                generateNewComposition(true);
            });
        } else {
           //  console.log('AudioContext est déjà en cours d\'exécution. État :', audioContext.state);
             generateNewComposition(true);
        }
        isReadyToStart = false;
       
    }
}

function draw() {
    if (isReadyToStart) return;

    background(0);
    composition.layers.forEach(layer => {
        if (layer.currentImage && layer.currentImage.width > 1) {
            push();
            // CORRECTION: On récupère la constante p5.js depuis l'objet global 'window'
            blendMode(window[layer.blendMode] || BLEND);
            tint(255, layer.opacity);
            image(layer.currentImage, 0, 0, width, height);
            pop();
        }
    });
}

function generateNewComposition(randomizeParams = false) {
    console.log("Génération d'une nouvelle composition...");
    
    if (allImages.length === 0 || allSounds.length === 0) {
        console.error("ERREUR CRITIQUE: Les listes d'assets sont vides.");
        return;
    }

    if (gui) gui.show();

    composition.layers.forEach((layer, i) => {
        if (layer.currentSound && layer.currentSound.isPlaying()) {
            layer.currentSound.stop();
        }

        const randomImageIndex = floor(random(allImages.length));
        const randomSoundIndex = floor(random(allSounds.length));
        layer.currentImage = allImages[randomImageIndex];
        layer.currentSound = allSounds[randomSoundIndex];

        if (randomizeParams) {
            layer.volume = random(0.5, 1);
            layer.opacity = random(150, 255);
            layer.blendMode = random(P5_BLEND_MODES);
            if (gui) {
                const folder = gui.folders[i];
                if (folder) folder.controllers.forEach(c => c.updateDisplay());
            }
        }
        
        if (layer.currentSound && !layer.currentSound.isPlaying()) {
            layer.currentSound.amp(layer.volume);
            //layer.currentSound.loop = true;
            layer.currentSound.play();
            //layer.currentSound.loop()

        }
    });
}

function setupGUI() {
    gui = new lil.GUI({ title: 'Panneau de Contrôle' });
    gui.add({ generate: () => generateNewComposition(true) }, 'generate').name('Nouvelle Itération');

    composition.layers.forEach((layer, i) => {
        const folder = gui.addFolder(`Couche Visuelle ${i + 1}`);
        folder.add(layer, 'volume', 0, 1, 0.01).name('Volume').onChange(value => {
            if (layer.currentSound) {
                layer.currentSound.amp(value);
            }
        });
        folder.add(layer, 'opacity', 0, 255, 1).name('Opacité');
        folder.add(layer, 'blendMode', P5_BLEND_MODES).name('Mode de Fusion');
        folder.open();
    });
    gui.hide();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}