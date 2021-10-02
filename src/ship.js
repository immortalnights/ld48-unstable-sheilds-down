import Phaser from 'phaser'

export class Ship extends Phaser.GameObjects.Container
{
    constructor(scene, x, y)
    {
        super(scene, x, y)

        this.speed = 150
        this.rotationSpeed = 300
        this.nextRotation = this.rotation

        this.hull = this.scene.add.triangle(0, 0, 10, 5, 0, 10, 0, 0, 0x000000, 1)
        this.hull.setStrokeStyle(1, 0xAAAAAA, 1)
        this.add(this.hull)

        this.setSize(10, 10)

        this.positionHistory = []
    }

    getAttachedPosition(index)
    {
        let position
        if (this.positionHistory.length - index > 0)
        {
            index = Math.max(this.positionHistory.length - index, 0)
            position = this.positionHistory[index]
        }
        else
        {
            position = {
                x: this.x - 20,
                y: this.y,
                r: this.rotation
            }
        }

        return position
    }

    preUpdate()
    {
        this.positionHistory.push({
            x: this.x,
            y: this.y,
            r: this.rotation
        })

        if (this.positionHistory.length > 100)
        {
            this.positionHistory.shift()
        }
    }
}

export class Container extends Phaser.GameObjects.Container
{
    constructor(scene, x, y)
    {
        super(scene, x, y)

        this.attachedTo = null

        this.hull = this.scene.add.rectangle(0, 0, 10, 5, 0x000000, 1)
        this.hull.setStrokeStyle(1, 0xAAAAAA, 1)
        this.add(this.hull)

        this.setSize(10, 10)
    }

    attachTo(other, lag)
    {
        this.attachedTo = other
        this.positionLag = lag

        const position = this.attachedTo.getAttachedPosition(this.positionLag)
        this.x = position.x
        this.y = position.y
        this.rotation = position.r
    }

    preUpdate()
    {
        if (this.attachedTo)
        {
            const position = this.attachedTo.getAttachedPosition(this.positionLag)

            // if (Phaser.Math.Distance.BetweenPoints(this, position) > 4)
            {
                this.x = position.x
                this.y = position.y
                this.rotation = position.r
            }
        }
    }
}