import { Skeleton } from "@/components/ui/skeleton";

const QUIPS: [string, string][] = [
  // Hinglish
  ["Thoda ruko yaar, page aa raha hai ✨", "bhai ka promise — abhi aaya"],
  ["Abhi aata hai, chain mat kaato bhai", "ek second please"],
  ["Data dhundh raha hun... thoda time lagega", "almost there, swear"],
  ["Yeh page Zomato ki tarah late? Nahi bhai — abhi aaya", "faster than Zomato, allegedly"],
  ["Bhaiya patience rakho. Sab milega.", "pinky promise from the server"],
  ["Bhai, ek second. Even chef ko time lagta hai.", "good things take time"],
  ["Ye Zomato nahi hai ki instantly aage — thoda raho", "we're actually faster though"],

  // Odia style (transliterated, with translation hint)
  ["Bhayana, ektu apeksha kara — page aasuchhi", "odia for: hold on brother, page is coming"],
  ["Ki hela bhai? Internet bhala achi to?", "just checking your connection isn't us"],
  ["Dhireta aasile sabu mile — page bi aasiba", "odia wisdom: good things come to those who wait"],
  ["Kana kala? Page load huchhi, tension neba nahi", "all is well, tension mat lo"],
  ["Server ta Bhubaneswar traffic deli achi 🚦", "not our fault, blame the traffic"],
  ["Bhai to screen dekhi dekhichhe — page aasuchhi, trust me", "we see you waiting"],
  ["Odia lo 'Apeksha' mane wait kara — so wait karo please", "bilingual loading service"],
  ["Bhai, page ta aasuchhi — BMC speed nahi, faster 😄", "at least faster than BMC"],
  ["Eka second bhai, server ta busy achi", "server is multitasking like a pro"],

  // Engodia (English + Odia mix)
  ["Aare bhai, data fetch hochhe — chai peeyo meanwhile ☕", "tea is always the answer"],
  ["Page ta thoda time lauchhe, aji sab busy achi", "everyone's hustling today"],
  ["Eki byapara! Page aasuchhi bhai, tension neba nahi", "it's literally coming right now"],
  ["Server ta thoda preoccupied achi — aasuchhi", "like chef on a Saturday night"],

  // Food-related English
  ["Kneading the data like pizza dough 🍕", "shaping up nicely"],
  ["This page is marinating. Good things take time.", "like the best pizza toppings"],
  ["Wood fire takes time to heat up. So does this server.", "same energy, different job"],
  ["Like dosa batter, some things need time to ferment 🫙", "worth the wait, guaranteed"],
  ["Your order is being prepared... wait, wrong app — your page is.", "kitchen confusion"],
  ["Tossing the data in the air like pizza dough 🍕", "hope it lands right"],
  ["Chef's special loading animation, only at B&CL", "exclusive experience"],
  ["This server runs on chai and prayers ☕🙏", "mostly prayers after 9 PM"],

  // Movie dialogue style
  ["Mere paas page hai.", "— Deewar (server edition, 2024)"],
  ["Ye dil maange more... data.", "— inspired by something iconic"],
  ["Picture abhi baaki hai mere dost 🎬", "page is the climax, coming soon"],
  ["Mogambo khush hua... jab page load hua 😈", "— Mr. India, server cut"],
  ["Ek tha data, ek tha server — dono abhi aa rahe hain", "true love story"],
  ["Don ko pakadna mushkil hai, page ko load karna bhi 😅", "Don reference, very relevant"],

  // Staff-specific / restaurant humour
  ["Counting today's dough... not the pizza kind 🤫", "sales will have to wait"],
  ["Checking if the checklist is already done. It's probably not. 😭", "fill it anyway"],
  ["Loading your checklist karma... good things incoming ✅", "you've been a good employee"],
  ["Server is somewhere between Bhubaneswar and Bangalore", "Hyderabad probably tbh"],
  ["Swiggy: 40 mins. This page: 3 seconds. See the difference? 🏆", "we win"],
  ["Asking the wood fire for more speed. It said no. 🔥", "fire has strong opinions"],
];

export default function Loading() {
  const [msg, sub] = QUIPS[Math.floor(Math.random() * QUIPS.length)];

  return (
    <div className="animate-fade-in">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="mt-2 h-4 w-32" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>

      {/* Fun loading quip */}
      <div className="mt-10 flex flex-col items-center gap-1.5 px-4 text-center">
        <p className="text-sm font-semibold text-content-secondary">{msg}</p>
        <p className="text-xs text-content-secondary/50">{sub}</p>
        <p className="mt-1 text-[11px] uppercase tracking-widest text-content-secondary/30">
          page is loading — hang tight
        </p>
      </div>
    </div>
  );
}
