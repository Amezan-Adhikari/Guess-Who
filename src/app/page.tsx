
import Nav from "@/components/Nav";

export default function Home(){
  return(
  <main className="font-[victor]">
    <Nav/>
    
    <img src="/icons/hero.svg" alt="hero" className="mx-auto px-10 md:max-w-lg max-w-sm"/>

    <div>
      <h1 className="bg-gradient-to-r from-[#F79060] to-[#8E10D7] text-center  bg-clip-text text-transparent text-4xl tracking-wider">KEPP THEM GUESSING !!!</h1>
      <p className="text-center mt-5 text-[#5D5D5D]">Best online guess who playing platform</p>
    </div>

    <div className="mx-auto mt-10 max-w-lg flex justify-center gap-4">
      <button className="bg-[#F79060] text-white px-4 py-2 rounded-md hover:bg-[#8E10D7] cursor-pointer transition duration-300 ease-in-out active:scale-80 active:opacity-90">Join Random</button>
      <a href="/join"><button className="bg-[#F79060] text-white px-4 py-2 rounded-md hover:bg-[#8E10D7] cursor-pointer transition duration-300 ease-in-out active:scale-80 active:opacity-90">Join Custom</button></a>
    </div>
  </main>
)
}