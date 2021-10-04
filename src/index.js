import Phaser from 'phaser'
import Intro from './introscene'
import Unstable from './gamescene'
import UI from './uiscene'


const config = {
    type: Phaser.AUTO,
    parent: '',
    width: 800,
    height: 600,
    scene: [ Intro, Unstable, UI ]
}

const game = new Phaser.Game(config)
