import { useEffect, useRef } from 'react'

interface ConfettiCelebrationProps {
  trigger: boolean
  onComplete?: () => void
}

export function ConfettiCelebration({ trigger, onComplete }: ConfettiCelebrationProps) {
  const confettiRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!trigger || !confettiRef.current) return

    // Clear any existing confetti
    confettiRef.current.innerHTML = ''

    // Create confetti pieces
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
    const confettiCount = 50

    for (let i = 0; i < confettiCount; i++) {
      const confettiPiece = document.createElement('div')
      confettiPiece.style.position = 'absolute'
      confettiPiece.style.width = Math.random() > 0.5 ? '8px' : '6px'
      confettiPiece.style.height = Math.random() > 0.5 ? '8px' : '6px'
      confettiPiece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      confettiPiece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0%'
      confettiPiece.style.left = `${Math.random() * 100}%`
      confettiPiece.style.top = '-20px'
      confettiPiece.style.opacity = '1'
      confettiPiece.style.zIndex = '9999'
      confettiPiece.style.pointerEvents = 'none'
      confettiPiece.style.transform = `rotate(${Math.random() * 360}deg)`
      
      // Create falling animation with CSS
      const duration = Math.random() * 3000 + 2000 // 2-5 seconds
      const drift = (Math.random() - 0.5) * 200 // -100 to 100px horizontal drift
      
      confettiPiece.style.animation = `confettiFall ${duration}ms ease-out forwards`
      confettiPiece.style.setProperty('--drift', `${drift}px`)
      
      confettiRef.current.appendChild(confettiPiece)
    }

    // Clean up after animation
    const cleanupTimeout = setTimeout(() => {
      if (confettiRef.current) {
        confettiRef.current.innerHTML = ''
      }
      onComplete?.()
    }, 5000)

    return () => clearTimeout(cleanupTimeout)
  }, [trigger, onComplete])

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(-20px) translateX(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(var(--drift, 0px)) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
      <div
        ref={confettiRef}
        className="fixed inset-0 pointer-events-none z-50"
        style={{ overflow: 'hidden' }}
      />
    </>
  )
}

// Success celebration with text animation
interface CelebrationToastProps {
  show: boolean
  goalTitle: string
  onComplete?: () => void
}

export function CelebrationToast({ show, goalTitle, onComplete }: CelebrationToastProps) {
  const toastRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!show || !toastRef.current) return

    const element = toastRef.current
    
    // Reset initial state
    element.style.opacity = '0'
    element.style.transform = 'translateX(-50%) translateY(100px) scale(0.8)'
    
    // Animate in
    setTimeout(() => {
      element.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      element.style.opacity = '1'
      element.style.transform = 'translateX(-50%) translateY(0px) scale(1)'
    }, 100)
    
    // Pulse effect
    setTimeout(() => {
      element.style.transition = 'transform 0.6s ease-in-out'
      element.style.transform = 'translateX(-50%) translateY(0px) scale(1.05)'
      
      setTimeout(() => {
        element.style.transform = 'translateX(-50%) translateY(0px) scale(1)'
      }, 300)
    }, 900)

    // Animate out
    const hideTimeout = setTimeout(() => {
      element.style.transition = 'all 0.5s ease-in'
      element.style.opacity = '0'
      element.style.transform = 'translateX(-50%) translateY(-100px) scale(0.8)'
      
      setTimeout(() => {
        onComplete?.()
      }, 500)
    }, 3000)

    return () => clearTimeout(hideTimeout)
  }, [show, onComplete])

  if (!show) return null

  return (
    <div
      ref={toastRef}
      className="fixed top-20 left-1/2 z-50 
                 bg-gradient-to-r from-green-500 to-emerald-500 
                 text-white px-6 py-4 rounded-lg shadow-lg
                 border border-green-400 min-w-80 text-center"
      style={{ 
        opacity: 0, 
        transform: 'translateX(-50%) translateY(100px) scale(0.8)',
        transition: 'none'
      }}
    >
      <div className="flex items-center justify-center space-x-2">
        <div className="text-2xl">🎉</div>
        <div>
          <div className="font-bold text-lg">Goal Completed!</div>
          <div className="text-sm opacity-90 truncate max-w-60">"{goalTitle}"</div>
        </div>
        <div className="text-2xl">🎉</div>
      </div>
    </div>
  )
}