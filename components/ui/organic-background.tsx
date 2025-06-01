export function OrganicBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <div className="absolute top-0 left-0 w-[800px] h-[800px] rounded-full bg-[#4F7942]/20 blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] rounded-full bg-[#4F7942]/20 blur-3xl transform translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-[#4F7942]/20 blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
    </div>
  )
}

