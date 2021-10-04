import Phaser from 'phaser'


export default class Button extends Phaser.GameObjects.Container
{
  constructor(scene, x, y, w, h, label, callback, options)
  {
    super(scene, x, y)

    this.data = new Phaser.Data.DataManager(this)
    this.data.set({
      active: false,
      over: false
    })

    const colors = {
      inactive: 0x111111,
      over: 0x999999,
      active: 0xFFFFFF,
    }

    this.border = new Phaser.GameObjects.Rectangle(scene, 0, 0, w, h, 0x000000, 1)
    this.border.setStrokeStyle(1, colors.inactive, 1)

    this.add(this.border)

    if (typeof label === 'string')
    {
      this.label = new Phaser.GameObjects.Text(scene, 0, -(h/3), label, options)
      this.label.setOrigin(0.5, 0)
    }
    else
    {
      this.label = label
    }

    this.add(this.label)

    this.setSize(w, h)
    this.setInteractive()
    this.on('pointerover', () => {
      this.data.set('over', true)
    })
    this.on('pointerout', () => {
      this.data.set('over', false)
    })
    this.on('pointerup', () => {
      this.data.set('active', false)
      callback(this)
    })
    this.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation()
      this.data.set('active', true)
    })

    this.on('changedata-active', (obj, val, prev) => {
      if (val === true)
      {
        this.border.setStrokeStyle(1, colors.active, 1)
      }
      else if (this.data.values.over === true)
      {
        this.border.setStrokeStyle(1, colors.over, 1)
      }
      else
      {
        this.border.setStrokeStyle(1, colors.inactive, 1)
      }
    })

    this.on('changedata-over', (obj, val, prev) => {
      if (val === true)
      {
        this.border.setStrokeStyle(1, colors.over, 1)
      }
      else if (this.data.values.active === true)
      {
        this.border.setStrokeStyle(1, colors.active, 1)
      }
      else
      {
        this.border.setStrokeStyle(1, colors.inactive, 1)
      }
    })
  }

  setActive(b)
  {
    this.data.set('active', b)
  }
}