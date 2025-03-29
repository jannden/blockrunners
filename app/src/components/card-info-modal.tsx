import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { AbilityCard } from "./game-interface"

interface CardInfoModalProps {
  open: boolean
  onClose: () => void
  card: AbilityCard
}

export function CardInfoModal({ open, onClose, card }: CardInfoModalProps) {
  const getCardColor = (type: string) => {
    switch (type) {
      case "attack":
        return "bg-[#ff4d4f]"
      case "defense":
        return "bg-[#52c41a]"
      case "speed":
        return "bg-[#1890ff]"
      case "stealth":
        return "bg-[#722ed1]"
      case "hack":
        return "bg-[#fa8c16]"
      default:
        return "bg-gray-500"
    }
  }

  const getCardDescription = (type: string) => {
    switch (type) {
      case "attack":
        return "Attack cards deal damage to enemies and obstacles."
      case "defense":
        return "Defense cards protect you from damage and negative effects."
      case "speed":
        return "Speed cards allow you to move faster or take extra actions."
      case "stealth":
        return "Stealth cards help you avoid detection or bypass security."
      case "hack":
        return "Hack cards let you manipulate the environment or enemy systems."
      default:
        return ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md">
        <DialogHeader>
          <div className={`${getCardColor(card.type)} text-white p-4 -m-6 mb-2`}>
            <Badge className="bg-black text-white border-0 mb-2">{card.type}</Badge>
            <DialogTitle className="text-xl font-black">{card.name}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div>
            <h3 className="font-bold text-lg">Effect</h3>
            <p className="text-sm mt-1">{card.description}</p>
          </div>

          <div>
            <h3 className="font-bold text-lg">Power Level</h3>
            <div className="flex items-center mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-full mr-1 ${i < card.power ? getCardColor(card.type) : "bg-gray-200"}`}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg">Card Type</h3>
            <p className="text-sm mt-1">{getCardDescription(card.type)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

