import Phaser from 'phaser'

export class Station extends Phaser.GameObjects.Container
{
    constructor(scene, x, y, radius = 10)
    {
        super(scene, x, y)

        this.data = new Phaser.Data.DataManager(this)
        this.data.set({
            rebooting: false,
            integrity: 100
        })
        this.rebooting = false

        this.hull = this.scene.add.arc(0, 0, radius, 0, 360, false, 0x000000, 1)
        this.hull.setStrokeStyle(1, 0xBBBBBB, 1)
        this.add(this.hull)

        this.shield = this.scene.add.arc(0, 0, radius * 3)
        this.shield.setStrokeStyle(1, 0x008800, 1)
        this.add(this.shield)

        this.setSize(20, 20)

        this.on('changedata-rebooting', (obj, val, prev) => {
            this.scene.tweens.add({
                targets: this.shield,
                alpha: Number(!val),
                ease: 'Power4'
            })
        })
    }

    takeDamage(amount)
    {
        if (this.data.get('rebooting') === true)
        {
            this.data.add('integrity', -amount)
        }
        else
        {
            // No damage due to shield
        }
    }
}