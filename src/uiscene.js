import Phaser from 'phaser'
import Button from './button'
import { Upgrades } from './defines'
import { toMMSS } from './utilities'


const formatPercent = (val, padding = 0) => {
    return val.toFixed(0).padStart(3, '0') + '%'
}


class UpgradeItem extends Phaser.GameObjects.Container
{
    constructor(scene, x, y, details)
    {
        super(scene, x, y)

        const width = 220
        const height = 120

        const background = scene.add.rectangle(0, 0, width, height, 0x000000, 0.85)
        background.setStrokeStyle(1, 0xdddddd, 1)
        this.add(background)

        const headerText = scene.add.text(0, -(height / 2) + 20, details.name)
        headerText.setOrigin(0.5, 1)
        this.add(headerText)

        const currentValue = this.getValueFor(details.id)
        const currentValueText = scene.add.text(0, -10, `${details.valueLabel} ${currentValue}`)
        currentValueText.setOrigin(0.5, 1)
        this.add(currentValueText)

        const costText = scene.add.text(0, 20, `Cost ${details.cost}`)
        costText.setOrigin(0.5, 1)
        this.add(costText)

        this.setSize(width, height)

        this.setInteractive()
        this.on('pointerdown', () => {
            let credits = scene.registry.get('credits')
            if (credits >= details.cost)
            {
                // shouldn't be changing the game state in the UI!
                credits -= Math.max(details.cost, 0)
                scene.registry.set('credits', credits)
                details.cost = Math.floor(details.cost * details.costMultiplier)
                costText.setText(`Cost ${details.cost}`)

                scene.scene.get('game').events.emit('upgrade', { ...details })

                // update local value
                const currentValue = this.getValueFor(details.id)
                currentValueText.setText(`${details.valueLabel} ${currentValue}`)
            }
            else
            {
                console.log(`Cannot afford upgrade ${details.id} (have=${credits}, need=${details.cost})`)
            }
        })
        this.on('pointerover', () => {
            background.setStrokeStyle(1, 0x0000ff, 1)
        })
        this.on('pointerout', () => {
            background.setStrokeStyle(1, 0xdddddd, 1)
        })
    }

    getValueFor(type)
    {
        let val
        const gameScene = this.scene.scene.get('game')
        switch (type)
        {
            case 'shipweight':
            {
                val = gameScene.ship.data.get('maxWeight')
                break
            }
            case 'shipminingrate':
            {
                val = gameScene.ship.data.get('miningRate')
                break
            }
            case 'stationintegrity':
            {
                val = gameScene.station.data.get('maxIntegrity')
                break
            }
            case 'stationtransferrate':
            {
                val = gameScene.station.data.get('transferRate')
                break
            }
            case 'stationrepair':
            {
                val = gameScene.station.data.get('integrity')
                break
            }
            case 'newcontainer':
            {
                val = gameScene.containers.getChildren().length + gameScene.ship.containers.length
                break
            }
        }

        return val
    }
}


class UpgradeComponent extends Phaser.GameObjects.Container
{
    constructor(scene, x, y)
    {
        super(scene, x, y)

        const { width, height } = scene.sys.game.canvas

        const background = scene.add.rectangle(0, 0, width + 10, height - 120, 0x000000, 0.75)
        background.setStrokeStyle(1, 0xffffff, 1)
        this.add(background)

        const columnXOffsets = {
            ship: -250,
            station: 0,
            special: 250,
        }

        const yOffsetStart = -100
        const yOffsetAdd = 200
        const rowYOffset = {}
        Upgrades.forEach(item => {
            const xOffset = columnXOffsets[item.category]

            if (rowYOffset[item.category] == undefined)
            {
                rowYOffset[item.category] = 0
            }

            const y = yOffsetStart + (yOffsetAdd * rowYOffset[item.category])

            const one = new UpgradeItem(scene, xOffset, y, item)
            this.add(one)

            ++rowYOffset[item.category]
        })
    }
}


export default class UI extends Phaser.Scene
{
    constructor()
    {
      super({
          key: 'ui'
      })
    }

    create()
    {
        const { width, height } = this.sys.game.canvas

        this.upgrades = [ ...Upgrades ]

        const background = this.add.rectangle(width / 2, 28, width + 4, 64, 0x000000, 0.75)
        background.setStrokeStyle(1, 0x222222, 1)

        const creditsTextLabel = this.add.text(10, 10, "Credits", {
            color: '#aaaaaa'
        })
        const creditsText = this.add.text(10, 26, "0000000", {
            fontSize: 32,
        })

        const setCreditsText = val => {
            if (val > 9999999)
            {
                val = 9999999
            }

            creditsText.setText(val.toFixed(0).padStart(7, '0'))
        }

        setCreditsText(this.registry.get('credits'))

        const countdownTextLabel = this.add.text(width / 2 - 34, 10, "Secure", {
            color: '#00DD00'
        })
        const countdownText = this.add.text(width / 2 - 34, 26, toMMSS(0), {
            fontSize: 32,
        })

        const stationIntegrityTextLabel = this.add.text(width -100, 10, "Integrity", {
            color: '#aaaaaa'
        })
        this.stationIntegrityText = this.add.text(width - 100, 26, "000%", {
            fontSize: 32,
        })

        let upgradeDialog = null
        const showUpgradeDialog = () => {
            if (upgradeDialog)
            {
                upgradeDialog.destroy()
                upgradeDialog = null
                this.scene.resume('game')
            }
            else
            {
                upgradeDialog = new UpgradeComponent(this, width / 2, height / 2)
                this.add.existing(upgradeDialog)
                this.scene.pause('game')
            }
        }

        const upgradesButton = new Button(this, 64, height - 26, 100, 28, "Upgrades", showUpgradeDialog)
        this.add.existing(upgradesButton)
        // showUpgradeDialog()

        this.game.events.on('changedata-credits', (obj, val, prev) => {
            setCreditsText(val)
        })

        this.game.events.on('changedata-timer', (obj, val, prev) => {
            countdownText.setText(toMMSS(val))
        })
        this.game.events.on('changedata-vulnerable', (obj, val, prev) => {
            if (val)
            {
                countdownTextLabel.setText("Vulnerable")
                countdownTextLabel.setColor('#DD0000')
            }
            else
            {
                countdownTextLabel.setText("Secure")
                countdownTextLabel.setColor('#00DD00')
            }
        })

        this.cameras.main.on('camerafadeoutcomplete', () => {
            this.scene.get('game').scene.restart()
            this.scene.restart();
        });

        this.game.events.on('changedata-gameover', () => {
            this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75)
            this.add.text(width / 2, height / 2, "Game Over", {
                fontSize: 48,
            }).setOrigin(0.5, 1)

            const duration = Date.now() - this.registry.get('startTime')
            this.add.text(width / 2, height / 2 + 30, `You survived ${toMMSS(duration)}`).setOrigin(0.5, 1)

            const restartButton = this.add.text(width / 2, height / 2 + 50, "restart?").setOrigin(0.5, 1)
            restartButton.setInteractive()
            restartButton.on('pointerdown', () => {
                this.cameras.main.fade(2000, 0x000000,0x000000, 0x000000)
            })
        })
    }

    update(time, delta)
    {
        const gameScene = this.scene.get('game')
        const [ maxIntegrity, integrity ] = gameScene.station.data.get([ 'maxIntegrity', 'integrity' ])
        this.stationIntegrityText.setText(formatPercent((integrity / maxIntegrity) * 100, 3))
    }
}