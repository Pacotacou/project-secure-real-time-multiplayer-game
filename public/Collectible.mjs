const canvas = document.getElementById('game-window');
const ctx = canvas.getContext('2d');
class Collectible {
  constructor({x, y, value, id}) {
    this.x = x
    this.y = y
    this.value = value
    this.id = id
    this.w = 10
    this.h = 10
  }
  
  render() {
    ctx.fillStyle = 'yellow'
    ctx.fillRect(this.x+10, this.y+60, 10, 10);
    ctx.font = "15px serif"
    ctx.fillStyle = "black"
    ctx.textAlign = "center"
    ctx.fillText( this.value, this.x+10, this.y+60)
  }
}

try {
  module.exports = Collectible;
} catch(e) {}

export default Collectible;
