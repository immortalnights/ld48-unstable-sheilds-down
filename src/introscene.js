
export default class IntroductionScene extends Phaser.Scene
{
    constructor()
    {
        super({
            key: 'introduction'
        })
    }

    create()
    {
        const { width, height } = this.sys.game.canvas

        this.add.text(width / 6, 30, "Unstable", {
            fontSize: 42
        })

        this.add.text(60, 120, `


The station shield is unstable... 

The station shield will fail in sem-random intervals. The Secure
time is an estimation. When the shield fails the system has to
reboot. During that time, the station is vulnerable.


W, A, S, D or Cursor keys - move the spaceship.
Space                     - attach / detach cargo container


With containers attached, navigate next to asteroids to mine
resources. Detach the container within range of the station to
unload and receive credits.

Neither the station or the ship has weapons. Just survive for
as long as you can.


Spend credits on upgrades.

`, {
            wordWrap: { width: width - 120, useAdvancedWrap: false }
        })

        this.add.text(width - width / 4, height - 120, "Click to start.")
        this.add.rectangle()

        this.input.on('pointerdown', () => {
            this.scene.switch('game')
        })
    }
}