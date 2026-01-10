'use client'

// Ghost Case custom image with dice and real CS2 skins orbiting around it

const ORBIT_SKINS = [
  // Top row
  'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Q7uCvZaZkNM-SD1iWwOpzj-1gSCGn20tztm_UyIn_JHKUbgYlWMcmQ-ZcskSwldS0MOnntAfd3YlMzH35jntXrnE8SOGRGG8', // Karambit Fade
  'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSI_-RHGavzOtyufRkASq2lkxx4W-HnNyqJC3FZwYoC5p0Q7FfthW6wdWxPu-371Pdit5HnyXgznQeHYY5wyA', // AK Redline
  'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk4veqYaF7IfysCnWRxuF4j-B-Xxa_nBovp3Pdwtj9cC_GaAd0DZdwQu9fuhS4kNy0NePntVTbjYpCyyT_3CgY5i9j_a9cBkcCWUKV', // AWP Asiimov
  // Right side
  'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu4vx603vRA_Olpfu-TVJ7uK9V6xsLvSEHGaA_u13ve5WSDu2jCIvtjyTg8GpIHyUOlB2CcdwQOUKs0btx4W0ZbngtgOM2I5Fn3n-iyob6y5p4ucGT-N7rQg4EtBM', // Sport Gloves
  'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7vORbqhsLfWAMWuZxuZi_uI_TX6wxxkjsGXXnImsJ37COlUoWcByEOMOtxa5kdXmNu3htVPZjN1bjXKpkHLRfQU', // Deagle
  // Bottom row
  'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_OGMWrEwL9JuPh5SjuMlxgmoCm6l4r9KD7KcA50WcR0R7NctBm_k9fgN7nn4FGMitpCxH-vjikc6Cs4t-5TVaMgr_bJz1aWEz9VGgc', // M4A1-S
  'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSI-WsG3SA_uV_vO1WTCa9kxQ1vjiBpYL8JSLSMxghCMEjEeNe5hHpw9zhYuOz5VfcitpBmyqt3X9O6itrsesFUfYmrKzTkUifZqPQtnZK', // USP-S
  'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1a7s2oaaBoH_yaCW-Ej-8u5bZvHnq1w0Vz62TUzNj4eCiVblMmXMAkROJeskLpkdXjMrzksVTAy9US8PY25So', // Glock
  // Left side
  'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afVSKP-EAm6extF6ueZhW2exwkl2tmTXwt39eCiUPQR2DMN4TOVetUK8xoLgM-K341eM2otDnC6okGoXufBz_TAB', // M4A4
  'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0PSneqF-JeKDC2mE_u995LZWTTuygxIYvjiBk5r0bymVZwIoWZJ1QLEDs0O6ktayZr6ztFeIjYxAyyX-jH8b5y5vt-wDB_Y7uvqAHvjgL6w', // AK
]

// Position each skin evenly in a circle (10 items = 36° apart)
// Starting from top, going clockwise
const POSITIONS = (() => {
  const positions = []
  const radius = 38 // Distance from center (%)
  const count = 10
  for (let i = 0; i < count; i++) {
    // Start from top (-90°) and go clockwise
    const angle = (-90 + (i * 360 / count)) * (Math.PI / 180)
    positions.push({
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle)
    })
  }
  return positions
})()

export function GhostCaseImage({ className }: { className?: string }) {
  return (
    <div className={`relative aspect-square ${className || ''}`}>
      {/* Background circle */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-2 border-purple-600/50" />

      {/* Orbiting skins */}
      {ORBIT_SKINS.map((url, i) => (
        <div
          key={i}
          className="absolute w-[15%] h-[15%] -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${POSITIONS[i].x}%`,
            top: `${POSITIONS[i].y}%`,
          }}
        >
          <img
            src={url}
            alt=""
            className="w-full h-full object-contain drop-shadow-lg"
          />
        </div>
      ))}

      {/* Central dice */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[32%] h-[32%]">
        <div className="relative w-full h-full -rotate-12">
          {/* Dice glow */}
          <div className="absolute inset-[-20%] bg-purple-500/40 rounded-2xl blur-xl" />

          {/* Dice body */}
          <div className="relative w-full h-full bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl border-2 border-purple-400/50 shadow-2xl">
            {/* Dice dots (6) - 2x3 grid */}
            <div className="absolute inset-[18%] grid grid-cols-2 grid-rows-3 gap-[10%] place-items-center">
              <div className="w-[70%] aspect-square rounded-full bg-white shadow-md" />
              <div className="w-[70%] aspect-square rounded-full bg-white shadow-md" />
              <div className="w-[70%] aspect-square rounded-full bg-white shadow-md" />
              <div className="w-[70%] aspect-square rounded-full bg-white shadow-md" />
              <div className="w-[70%] aspect-square rounded-full bg-white shadow-md" />
              <div className="w-[70%] aspect-square rounded-full bg-white shadow-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
