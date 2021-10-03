import Phaser from 'phaser'
import { Resources } from './defines'


const createPolygonPoints = (x, y, r = 20, totalPoints = 8) => {
  const points = []

  for (let p = 0; p < totalPoints; p++)
  {
    points.push({ x, y })
  }

  const circle = new Phaser.Geom.Circle(x, y, r)
  Phaser.Actions.PlaceOnCircle(points, circle)

  points.forEach(point => {
    point.x += Phaser.Math.RND.between(-(r * 0.25), r * 0.25) + r
    point.y += Phaser.Math.RND.between(-(r * 0.25), r * 0.25) + r
  })

  return points
}

export default class Asteroid extends Phaser.GameObjects.Polygon
{
  constructor(scene, x, y, r)
  {
    super(scene, x, y, createPolygonPoints(0, 0, r))
    this.setStrokeStyle(1, 0x222222, 1)
    this.setFillStyle(0x111111, 1)

    const resourceType = Phaser.Math.RND.pick(Object.keys(Resources))
    const resource = Resources[resourceType]
    this.setData({
      integrity: 200,
      offscreenTime: 0,
      speed: Phaser.Math.RND.between(15, 40),
      type: resourceType,
      quantity: Phaser.Math.RND.between(resource.min, resource.max),
    })

    this.on(Phaser.GameObjects.Events.ADDED_TO_SCENE, () => {
      this.body.angularVelocity = Phaser.Math.RND.between(100, 200)
    })
  }

  preUpdate(time, delta)
  {
    if (this.scene.isObjOffscreen(this))
    {
      this.incData('offscreenTime', delta)
    }

    const [ offscreenTime, integrity ] = this.getData([ 'offscreenTime', 'integrity' ])
    if (integrity < 0 || offscreenTime > 5000)
    {
      console.log("Asteroid destroyed")
      this.destroy()
    }
  }
}