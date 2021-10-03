import Phaser from 'phaser'


export default class Enemy extends Phaser.GameObjects.Container
{
    constructor(scene, x, y)
    {
        super(scene, x, y)
        this.data = new Phaser.Data.DataManager(this)
        this.data.set({
            speed: Phaser.Math.RND.between(120, 160),
            turnSpeed: Phaser.Math.RND.between(0, 1) === 0 ? 0.02 : -0.02,
            weaponRange: 40,
            weaponDamage: 2
        })

        this.weaponROF = 0
        this.weaponCooldown = 0

        this.hull = this.scene.add.triangle(0, 0, 15, 5, 0, 10, 0, 0, 0x000000, 1)
        this.hull.setStrokeStyle(1, 0xFF2222, 1)
        this.add(this.hull)

        this.setSize(10, 10)

        this.state = 'approach'
        this.orbitDistance = 100

        this.on(Phaser.GameObjects.Events.ADDED_TO_SCENE, (obj, scene) => {
            
        })
    }

    preUpdate(time, delta)
    {
        const [ speed, turnSpeed, weaponRange, weaponDamage ] = this.data.get([ 'speed', 'turnSpeed', 'weaponRange', 'weaponDamage' ])
        this.scene.physics.velocityFromRotation(this.rotation, speed, this.body.velocity)

        const station = this.scene.station
        const rotation = Phaser.Math.Angle.BetweenPoints(this, { x: station.x, y: station.y })
        this.rotation = Phaser.Math.Angle.RotateTo(this.rotation, rotation, turnSpeed)

        if (this.weaponCooldown < 0)
        {
            const distance = Phaser.Math.Distance.BetweenPoints(this, station)
            if (distance < weaponRange)
            {
                // FIRE
                this.weaponCooldown = 200
                this.scene.events.emit('enemy_fire', this, 200, weaponDamage)
            }
        }
        else
        {
            this.weaponCooldown -= delta
        }
    }
}