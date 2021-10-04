import Phaser from 'phaser'
import { Resources } from './defines'


const BASE_INTEGRITY = 1000
const BASE_TRANSFER_RANGE = 30
const BASE_TRANSFER_RATE = 80


export class Station extends Phaser.GameObjects.Container
{
    constructor(scene, x, y, radius = 10)
    {
        super(scene, x, y)

        this.data = new Phaser.Data.DataManager(this)
        this.data.set({
            rebooting: false,
            maxIntegrity: BASE_INTEGRITY,
            integrity: BASE_INTEGRITY,
            transferRange: BASE_TRANSFER_RANGE,
            transferRate: BASE_TRANSFER_RATE,
            processRate: Math.floor(BASE_TRANSFER_RATE  * 0.6)
        })

        console.log(Resources)

        this.resources = new Phaser.Data.DataManager(this)
        Object.keys(Resources).forEach(item => {
            this.resources.set(item, 0)
        })

        this.rebooting = false

        this.shield = this.scene.add.arc(0, 0, radius * 3, 0, 360, false, 0x008800, 0.05)
        this.shield.setStrokeStyle(1, 0x008800, 1)
        this.add(this.shield)

        this.hull = this.scene.add.arc(0, 0, radius, 0, 360, false, 0x000000, 1)
        this.hull.setStrokeStyle(1, 0xBBBBBB, 1)
        this.add(this.hull)

        this.setSize(20, 20)

        this.on('changedata-rebooting', (obj, val, prev) => {
            this.scene.tweens.add({
                targets: this.shield,
                alpha: Number(!val),
                ease: 'Power4'
            })
        })
    }

    preUpdate(time, delta)
    {
        let processAmount = this.data.get('processRate') * (delta / 1000)
        Object.keys(this.resources.list).forEach(key => {
            let amount = this.resources.get(key)
            if (amount > 0)
            {
                const processed = Math.min(processAmount, amount)
                amount -= processed
                processAmount -= processed
                this.resources.set(key, amount)

                const credits = Resources[key].value * processed
                this.scene.registry.inc('credits', credits)

                console.log(`Processed ${processed} ${key} for ${credits} (remaining=${amount})`)
            }
        })
    }

    takeDamage(amount)
    {
        let [ integrity, rebooting ] = this.data.get([ 'integrity', 'rebooting' ])

        if (rebooting === true)
        {
            integrity -= amount
            this.data.set('integrity', Math.max(integrity, 0))
            console.log(`Station took damage (integrity=${integrity})`)
        }
        else
        {
            // No damage due to shield
        }
    }
}