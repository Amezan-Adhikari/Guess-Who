import Logo from "@/components/Logo";

export default function Nav(){
  return(
    <nav className="flex justify-between md:flex-row flex-col items-center md:px-64 py-4">
      <Logo/>
      <div className="text-[#4d4d4d] flex gap-4">

        <a href="/join"><button className="font-[victor] cursor-pointer hover:text-[#000]">
          Join Room
        </button></a>
        |
        <a href="/create"><button className="font-[victor] cursor-pointer hover:text-[#000]">
          Create Room
        </button></a>
      </div>
    </nav>
)
}