import Phaser from 'phaser'

class Unstable extends Phaser.Scene
{
  constructor()
  {
    super();
  }

  preload()
  {
  }

  create()
  {
  }
}

const config = {
  type: Phaser.AUTO,
  parent: '',
  width: 800,
  height: 600,
  scene: Unstable,
}

const game = new Phaser.Game(config)
