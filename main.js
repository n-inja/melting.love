class Circle {
    constructor(x, y, r, rv) {
        this.x = x
        this.y = y
        this.vy = 0
        this.r = r
        this.rv = rv
        this.angle = 0
    }
    update (delta) {
        this.angle += this.rv * delta
        this.y += this.vy * delta * 10
        this.vy += 9.8 * delta * 10
    }
    draw (ctx, img) {
        ctx.translate(this.x, this.y)
        ctx.rotate(this.angle)
        ctx.drawImage(img, -this.r, -this.r, this.r * 2, this.r * 2)
        ctx.rotate(-this.angle)
        ctx.translate(-this.x, -this.y)
    }
}
class Back {
    constructor(x, y, size) {
        this.x = x
        this.y = y
        this.alpha = 0.0
        this.beta = 0.01
        this.size = size
    }
    update (delta) {
        this.alpha += this.beta * delta
        this.beta += this.beta * delta
        this.size *= (1 + delta)
    }
    draw (ctx, img) {
        ctx.globalAlpha = Math.max(1.0 - this.alpha, 0)
        ctx.drawImage(img, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size)
        ctx.globalAlpha = 1.0
    }
}

(() => {
    if (window.flag) return
    window.flag = true
    const canvas = document.querySelector('#cv')
    const windowProp = {
        scale: 1.0
    }
    const onresize = () => {
        let rect = document.body.getBoundingClientRect()
        let scaleW = rect.width / canvas.width
        let scaleH = rect.height / canvas.height
        windowProp.scale = scaleW < scaleH ? scaleW : scaleH
        canvas.style.transform = `scale(${windowProp.scale},${windowProp.scale})`
        canvas.style.position = `fixed`
        canvas.style.left = `${((windowProp.scale - 1) * canvas.width / 2 + (rect.width - canvas.width * windowProp.scale) / 2)}px`
        canvas.style.top = `${((windowProp.scale - 1) * canvas.height / 2 + (rect.height - canvas.height * windowProp.scale) / 2)}px`
    }
    window.addEventListener('resize', onresize)
    onresize()
    const ctx = canvas.getContext('2d')
    const img = new Image()
    const img2 = new Image()
    img.src = 'img/meltinglove.png'
    img2.src = 'img/circle.png'
    const WIDTH = HEIGHT = 480
    const prop = {
        x: -WIDTH / 2 / Math.pow(2, 0.5),
        y: -HEIGHT / 2 / Math.pow(2, 0.5),
        w: img.width,
        h: img.height,
        gx: 0,
        gy: 0,
        angle: 0,
        rv: 0,
        sx: 1.0,
        sy: 1.0,
        buyo: -5000,
        buyoR: 1
    }
    const shades = new Array(10)
    let now = 0
    for (let i = 0; i < 10; i++) shades[i] = {x: 0, y: 0, hx: 0, hy: 0, angle: 0}
    const circles = [], backs = []
    const draw = () => {
        ctx.clearRect(0, 0, WIDTH, HEIGHT)
        for (let i = backs.length; i > 0; i--) {
            const b = backs.shift()
            b.draw(ctx, img)
            if (b.alpha < 1) backs.push(b)
        }
        for (let i = circles.length; i > 0; i--) {
            const c = circles.shift()
            c.draw(ctx, img2)
            if (c.y <= HEIGHT + c.r) circles.push(c)
        }
        ctx.translate(parseInt(WIDTH / 2), parseInt(HEIGHT / 2))
        if (Math.random() * 1000 < prop.rv * prop.rv) {
            backs.push(new Back(Math.random() * WIDTH, Math.random() * HEIGHT, (Math.random() + 1) * 10))
        }
        if (prop.rv > 3) {
            const mass = prop.rv > 6 ? 5 : 3
            for (let i = mass; i > 0; i--) {
                const id = (now - i + 10) % 10
                ctx.rotate(shades[id].angle)
                ctx.globalAlpha = (mass + 1 - i) / 10
                ctx.drawImage(img, shades[id].x, shades[id].y, shades[id].hx, shades[id].hy)
                ctx.rotate(-shades[id].angle)
            }
            ctx.globalAlpha = 1.0
        }
        ctx.rotate(prop.angle)
        ctx.drawImage(img, prop.gx + prop.x * prop.sx, prop.gy + prop.y * prop.sy, WIDTH * prop.sx / Math.pow(2, 0.5), HEIGHT * prop.sy / Math.pow(2, 0.5))
        shades[now].angle = prop.angle
        shades[now].x = prop.gx + prop.x * prop.sx
        shades[now].y = prop.gy + prop.y * prop.sy
        shades[now].hx = WIDTH * prop.sx / Math.pow(2, 0.5)
        shades[now].hy = HEIGHT * prop.sy / Math.pow(2, 0.5)
        now++
        now %= 10
        ctx.rotate(-prop.angle)
        ctx.translate(-parseInt(WIDTH / 2), -parseInt(HEIGHT / 2))
    }
    const event = () => {
        const r = Math.random()
        if (r < 0.6) {
            prop.rv += 0.03
        } else if (r < 0.99) {
            circles.push(new Circle(Math.random() * WIDTH, -5, 10 + 20 * Math.random(), 2.5 - Math.random() * 5))
        } else {
            prop.buyo = Date.now()
            prop.buyoR += 1
        }
    }
    window.addEventListener('mousemove', event)
    window.addEventListener('click', event)
    window.addEventListener('keydown', event)
    window.addEventListener('devicemotion', event)
    const easeSin = (time) => {
        const lambda = 1 / prop.buyoR
        const delta = (time - prop.buyo) / 1000
        if (delta > lambda * 2) return 1.0
        return 1.0 + Math.sin(delta / lambda * Math.PI) / 10 * prop.buyoR
    }
    const easeCos = (time) => {
        const lambda = 1 / prop.buyoR
        const delta = (time - prop.buyo) / 1000
        if (delta > lambda * 2) return 1.0
        return 1.0 + Math.cos((delta + lambda / 2) / lambda * Math.PI) / 10 * prop.buyoR
    }
    let lastTime = Date.now()
    const main = () => {
        const delta = (Date.now() - lastTime) / 1000
        circles.forEach(c => c.update(delta))
        backs.forEach(b => b.update(delta))
        prop.angle += prop.rv * delta
        prop.rv -= prop.rv * delta / 10
        prop.buyoR = Math.pow(prop.buyoR, 1 - delta)
        if (prop.angle > Math.PI) prop.angle -= 2 * Math.PI
        if (prop.angle < -Math.PI) prop.angle += 2 * Math.PI
        prop.sx = easeCos(Date.now())
        prop.sy = easeSin(Date.now())
        draw()
        lastTime = Date.now()
        requestAnimationFrame(main)
    }
    img.addEventListener('load', main)
})()
