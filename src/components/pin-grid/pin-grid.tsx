// "use client"

// import { useEffect, useState } from "react"
// import { PinCard } from "@/components/pins/PinCard"

// interface Pin {
//   id: string
//   title: string
//   imageUrl: string
//   user: {
//     name: string
//   }
// }

// export function PinGrid() {
//   const [pins, setPins] = useState<Pin[]>([])

//   useEffect(() => {
//     fetch("/api/pins")
//       .then((res) => res.json())
//       .then((data) => setPins(data))
//   }, [])

//   return (
//     <div className="columns-2 md:columns-3 lg:columns-4 gap-4 p-4">
//       {pins.map((pin) => (
//         <PinCard
//           key={pin.id}
//           imageUrl={pin.imageUrl}
//           title={pin.title}
//           username={pin.user?.name ?? "unknown"}
//           height={200 + Math.floor(Math.random() * 200)}
//         />
//       ))}
//     </div>
//   )
// }