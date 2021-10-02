import Phaser from 'phaser'

export class Station extends Phaser.GameObjects.Container
{
    constructor(scene, x, y, radius = 10)
    {
        super(scene, x, y)

        this.hull = this.scene.add.arc(0, 0, radius, 0, 360, false, 0x000000, 1)
        this.hull.setStrokeStyle(1, 0xBBBBBB, 1)
        this.add(this.hull)

        this.shield = this.scene.add.arc(0, 0, radius * 3)
        this.shield.setStrokeStyle(1, 0x008800, 1)
        this.add(this.shield)

        this.setSize(20, 20)
    }

    toggleShield(active)
    {
        this.scene.tweens.add({
            targets: this.shield,
            alpha: active,
            ease: 'Power4'
        })
    }
}