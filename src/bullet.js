import Phaser from 'phaser'


export default class Bullet extends Phaser.GameObjects.Arc
{
    constructor(scene, x, y, damage)
    {
        super(scene, x, y, 1, 0, 360, false, 0xffffff, 1)

        this.setData({
            damage,
        })

        this.on(Phaser.GameObjects.Events.ADDED_TO_SCENE, () => {
            this.body.setCollideWorldBounds(true)
            this.body.onWorldBounds = true
        })
    }
}
