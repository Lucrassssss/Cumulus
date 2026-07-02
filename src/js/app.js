const EVENT_SEED = [
  {id:1, title:"Botanical Illustration Hour", category:"Creative", host:"Herne Hill Arts Collective", venue:"Ink & Easel Studio", area:"Herne Hill", address:"Brockwell Park, London SE24", startOffsetMin:2223, durationMin:135, capacity:15, desc:"Slow down and study leaves, petals, and stems in fine detail. Calm, focused, and quietly social."},
  {id:2, title:"Chelsea Watercolour Social", category:"Creative", host:"Chelsea Arts Collective", venue:"The Pottery Loft", area:"Chelsea", address:"Chelsea Embankment, London SW3", startOffsetMin:4457, durationMin:150, capacity:27, desc:"Bring your own canvas energy — paints and a relaxed crowd of creatives supplied. No experience needed, just curiosity."},
  {id:3, title:"Ceramics & Chill", category:"Creative", host:"Mira Greco", venue:"Canvas & Co.", area:"Bermondsey", address:"Bermondsey Street, London SE1", startOffsetMin:43074, durationMin:135, capacity:25, desc:"Hands in the clay, shoulders down — a low-pressure evening of shaping, chatting, and glazing later."},
  {id:4, title:"Clay Modelling for Beginners", category:"Creative", host:"Femi Lin", venue:"Paint & Clay Studio", area:"Lewisham", address:"Lewisham High Street, London SE13", startOffsetMin:16282, durationMin:135, capacity:23, desc:"Wedge, coil, and pinch your way to a first piece, glazing notes included for next time."},
  {id:5, title:"Linocut Printmaking Workshop", category:"Creative", host:"Clapham Arts Collective", venue:"The Atelier Clapham", area:"Clapham", address:"Clapham Common, London SW4", startOffsetMin:28197, durationMin:180, capacity:23, desc:"Carve your own print block and pull a few editions to take home. Beginners very welcome."},
  {id:6, title:"Urban Sketchers Meetup — Hammersmith", category:"Creative", host:"Hammersmith Arts Collective", venue:"The Drawing Room", area:"Hammersmith", address:"Hammersmith Broadway, London W6", startOffsetMin:14493, durationMin:150, capacity:27, desc:"Grab a stool, a pencil, and join the group capturing the street scene as it happens."},
  {id:7, title:"Life Drawing & Low-Fi Beats", category:"Creative", host:"Bethnal Green Arts Collective", venue:"The Sketch House", area:"Bethnal Green", address:"Bethnal Green Gardens, London E2", startOffsetMin:32463, durationMin:180, capacity:19, desc:"Dynamic poses, dim lighting, and a live playlist. Materials provided, but feel free to bring your own sketchbook."},
  {id:8, title:"Sunday Sketch Club — Vauxhall", category:"Creative", host:"Tom Fontaine", venue:"The Kiln Room", area:"Vauxhall", address:"Vauxhall Pleasure Gardens, London SW8", startOffsetMin:41240, durationMin:135, capacity:17, desc:"Outdoor sketching with the group, materials available to borrow. A coffee run happens halfway through."},
  {id:9, title:"Collage & Cocktails", category:"Creative", host:"Callum Singh", venue:"Clayworks Studio", area:"Stoke Newington", address:"Clissold Park, London N16", startOffsetMin:25129, durationMin:165, capacity:17, desc:"Cut, paste, and rearrange old magazines into something new, with a drink in hand."},
  {id:10, title:"Pottery Painting Pop-Up", category:"Creative", host:"Greenwich Arts Collective", venue:"Brushwork Studio", area:"Greenwich", address:"Greenwich Park, London SE10", startOffsetMin:-74, durationMin:180, capacity:29, desc:"Pick a piece, paint it your way, take it home. A slow, sociable afternoon with tea on tap."},
  {id:11, title:"Plein Air Painting Session", category:"Creative", host:"Fitzrovia Arts Collective", venue:"Studio Nine", area:"Fitzrovia", address:"Fitzrovia, London W1T", startOffsetMin:17606, durationMin:180, capacity:17, desc:"Easels out, light changing fast — a relaxed outdoor painting session for any skill level."},
  {id:12, title:"Zine-Making Night", category:"Creative", host:"Tooting Arts Collective", venue:"The Colour Lab", area:"Tooting", address:"Tooting Common, London SW17", startOffsetMin:19354, durationMin:120, capacity:25, desc:"Fold, staple, and fill pages with whatever's on your mind — small press publishing, just for fun."},
  {id:13, title:"Valorant Watch Party", category:"Gaming", host:"Balham Gaming Crew", venue:"Arcade Underground", area:"Balham", address:"Balham High Road, London SW12", startOffsetMin:13155, durationMin:210, capacity:62, desc:"The grand finals on a massive projector, themed cocktails and giveaways between rounds."},
  {id:14, title:"Speedrun Social", category:"Gaming", host:"Marcus Walsh", venue:"The Console Room", area:"Dulwich", address:"Dulwich Park, London SE21", startOffsetMin:157, durationMin:210, capacity:78, desc:"Bring your best time or just come watch — friendly competitive runs with the crowd cheering along."},
  {id:15, title:"Board-to-Video Game Crossover Night", category:"Gaming", host:"Battersea Gaming Crew", venue:"Combo Breaker Arcade", area:"Battersea", address:"Battersea Park, London SW11", startOffsetMin:7451, durationMin:150, capacity:60, desc:"Board game mechanics meet video game energy — a hybrid night for crossover fans."},
  {id:16, title:"Cosplay & Co-op Night", category:"Gaming", host:"Wood Green Gaming Crew", venue:"Game Haus", area:"Wood Green", address:"Wood Green High Road, London N22", startOffsetMin:15812, durationMin:180, capacity:80, desc:"Dress up, team up, and tackle a co-op campaign with the rest of the crowd."},
  {id:17, title:"Mario Kart Grand Prix", category:"Gaming", host:"Mira Shah", venue:"The Loading Screen", area:"King's Cross", address:"King's Cross, London N1C", startOffsetMin:31969, durationMin:225, capacity:34, desc:"Eight-player chaos on the big screen, knockout rounds, and bragging rights on the line."},
  {id:18, title:"Smash Bros Tournament Night", category:"Gaming", host:"Muswell Hill Gaming Crew", venue:"NQ64 Muswell Hill", area:"Muswell Hill", address:"Alexandra Park, London N10", startOffsetMin:8361, durationMin:210, capacity:78, desc:"Casual bracket, big screens, snacks. Come solo or bring a squad — button-mashers to combo masters welcome."},
  {id:19, title:"LAN Party — Whitechapel", category:"Gaming", host:"Grace Walsh", venue:"The Byte Bar", area:"Whitechapel", address:"Whitechapel Road, London E1", startOffsetMin:34701, durationMin:180, capacity:40, desc:"Bring your rig, plug in, and battle it out on the local network all evening."},
  {id:20, title:"Tabletop RPG One-Shot", category:"Gaming", host:"Kingston Gaming Crew", venue:"Player One Lounge", area:"Kingston", address:"Kingston Riverside, London KT1", startOffsetMin:35463, durationMin:165, capacity:56, desc:"Pre-built characters, one evening, one story — perfect if you've never rolled a d20 before."},
  {id:21, title:"Retro Arcade Meetup — Hampstead", category:"Gaming", host:"Hampstead Gaming Crew", venue:"Heart of Gaming", area:"Hampstead", address:"Hampstead Heath, London NW3", startOffsetMin:-89, durationMin:211, capacity:74, desc:"Pixel art, pinball, and 90s nostalgia. A relaxed evening for anyone who grew up on cartridges."},
  {id:22, title:"Fighting Game Locals — Farringdon", category:"Gaming", host:"Farringdon Gaming Crew", venue:"The Joystick Bar", area:"Farringdon", address:"Farringdon Road, London EC1M", startOffsetMin:28831, durationMin:180, capacity:70, desc:"Bracket play for the regulars and newcomers alike — bring your stick or borrow a house pad."},
  {id:23, title:"Indie Dev Playtest Showcase", category:"Gaming", host:"Mayfair Gaming Crew", venue:"The Pixel Pit", area:"Mayfair", address:"Berkeley Square, London W1J", startOffsetMin:16366, durationMin:150, capacity:58, desc:"Playtest unreleased games from local developers, give feedback over a beer, meet the people building them."},
  {id:24, title:"Pixel Art & Pinball Night", category:"Gaming", host:"Petra Chen", venue:"Retro Rumble Arcade", area:"Forest Hill", address:"Horniman Gardens, London SE23", startOffsetMin:15200, durationMin:210, capacity:66, desc:"Pixel art on the walls, pinball machines warmed up, and a soundtrack straight out of an arcade cabinet."},
  {id:25, title:"Cult Classics Marathon", category:"Movie Nights", host:"Hugo Okafor", venue:"The Reel Room", area:"Tottenham", address:"Tottenham High Road, London N17", startOffsetMin:37543, durationMin:165, capacity:108, desc:"Back-to-back cult favourites with intermissions for popcorn refills and chat."},
  {id:26, title:"Silent Film & Live Score", category:"Movie Nights", host:"Crouch End Film Society", venue:"The Film Loft", area:"Crouch End", address:"Crouch End Broadway, London N8", startOffsetMin:26797, durationMin:195, capacity:70, desc:"A silent classic accompanied by a live musician improvising the score in real time."},
  {id:27, title:"Documentary Discussion Night", category:"Movie Nights", host:"Sam Andersson", venue:"The Roxy Screening Room", area:"Croydon", address:"Croydon Town Centre, London CR0", startOffsetMin:-118, durationMin:243, capacity:94, desc:"Watch, then talk it through — a thoughtful crowd unpacking the issues raised on screen."},
  {id:28, title:"Secret Cinema Pop-Up", category:"Movie Nights", host:"Tom Andersson", venue:"The Electric Room", area:"Islington", address:"Islington Green, London N1", startOffsetMin:4092, durationMin:150, capacity:122, desc:"We can't tell you the film, but expect a transporting set and a proper theatrical surprise."},
  {id:29, title:"Open-Air Cinema — Kensington", category:"Movie Nights", host:"Petra Doyle", venue:"Flicker House", area:"Kensington", address:"Kensington Gardens, London W8", startOffsetMin:16415, durationMin:150, capacity:150, desc:"Blankets down, projector up — bring snacks and settle in under the open sky."},
  {id:30, title:"Foreign Film Friday", category:"Movie Nights", host:"Kemi Adeyemi", venue:"Mystery Reels Woolwich", area:"Woolwich", address:"Woolwich Arsenal, London SE18", startOffsetMin:12145, durationMin:195, capacity:56, desc:"Subtitled gems from around the world, picked to spark conversation afterwards."},
  {id:31, title:"Midnight Movie Madness", category:"Movie Nights", host:"Ines Fontaine", venue:"The Projection Room", area:"Finsbury Park", address:"Finsbury Park, London N4", startOffsetMin:36186, durationMin:195, capacity:48, desc:"Late-night cult favourites for the night owls — doors open well after dark."},
  {id:32, title:"Animation Showcase", category:"Movie Nights", host:"Kemi Eriksen", venue:"Night Owl Cinema", area:"Walthamstow", address:"Walthamstow Wetlands, London E17", startOffsetMin:15611, durationMin:150, capacity:40, desc:"Shorts and features from animators pushing the medium somewhere new."},
  {id:33, title:"Short Films & Soda — Bromley", category:"Movie Nights", host:"Hugo Brennan", venue:"Rio Cinema", area:"Bromley", address:"Bromley Town Centre, London BR1", startOffsetMin:3962, durationMin:195, capacity:66, desc:"A curated set of indie short films from London-based directors, with a Q&A session after."},
  {id:34, title:"A24 Late Night Screening", category:"Movie Nights", host:"Maya Murphy", venue:"The Castle Cinema", area:"Crystal Palace", address:"Crystal Palace Park, London SE19", startOffsetMin:18814, durationMin:195, capacity:72, desc:"A community screening followed by an open discussion over drinks. This week's pick announced on the night."},
  {id:35, title:"Classic Film Club — Chiswick", category:"Movie Nights", host:"Lucas Andersson", venue:"Backyard Cinema Chiswick", area:"Chiswick", address:"Chiswick High Road, London W4", startOffsetMin:-49, durationMin:195, capacity:130, desc:"An old favourite on the big screen, introduced by a guest host with some background on the film."},
  {id:36, title:"Settlers Showdown", category:"Board Games", host:"Peckham Games Club", venue:"Settlers Lounge", area:"Peckham", address:"Peckham Rye Park, London SE15", startOffsetMin:3847, durationMin:165, capacity:32, desc:"A friendly knockout tournament with a small prize for whoever settles the most territory."},
  {id:37, title:"Strategy Board Game Night", category:"Board Games", host:"Putney Games Club", venue:"The Dice House", area:"Putney", address:"Putney Embankment, London SW15", startOffsetMin:4610, durationMin:165, capacity:18, desc:"Deep-cut strategy games for those who want more than Monopoly. Teachers on hand for anything new."},
  {id:38, title:"Card Game Carnival", category:"Board Games", host:"Shepherd's Bush Games Club", venue:"Knight's Table Games Café", area:"Shepherd's Bush", address:"Shepherd's Bush Green, London W12", startOffsetMin:7976, durationMin:195, capacity:22, desc:"Quick-fire card games rotating every twenty minutes — easy to learn, hard to put down."},
  {id:39, title:"Tabletop Taster Night", category:"Board Games", host:"Notting Hill Games Club", venue:"The Strategy Room", area:"Notting Hill", address:"Notting Hill Gate, London W11", startOffsetMin:39082, durationMin:210, capacity:22, desc:"Sample five different games in one evening, hosts on hand to teach the rules each time."},
  {id:40, title:"Backgammon & Beer", category:"Board Games", host:"Jordan Novak", venue:"The Card Room", area:"Highbury", address:"Highbury Fields, London N5", startOffsetMin:17209, durationMin:180, capacity:32, desc:"Doubles cubes out, pints poured, a relaxed evening of backgammon for all levels."},
  {id:41, title:"Sunday Chess in the Park — Ealing", category:"Board Games", host:"Oscar Hassan", venue:"Chance & Counters", area:"Ealing", address:"Ealing Common, London W5", startOffsetMin:8697, durationMin:195, capacity:24, desc:"Open-air boards set up along the green — whether you're an expert or don't know how the knight moves, pull up a chair."},
  {id:42, title:"Eurogame Enthusiasts Meetup", category:"Board Games", host:"Holloway Games Club", venue:"The Tabletop Tavern", area:"Holloway", address:"Holloway Road, London N7", startOffsetMin:20840, durationMin:195, capacity:24, desc:"Heavier strategy titles hit the table for the crowd that loves a long, satisfying game."},
  {id:43, title:"Co-op Board Game Social", category:"Board Games", host:"Richmond Games Club", venue:"The Game Box", area:"Richmond", address:"Richmond Riverside, London TW9", startOffsetMin:30154, durationMin:150, capacity:18, desc:"Games built for teamwork, not competition — beat the board together, not each other."},
  {id:44, title:"Puzzle Night — Shoreditch", category:"Board Games", host:"Shoreditch Games Club", venue:"Dice & Slice", area:"Shoreditch", address:"Shoreditch High Street, London E1", startOffsetMin:35354, durationMin:150, capacity:18, desc:"Jigsaw and logic puzzles laid out across shared tables, work on one or hop between a few."},
  {id:45, title:"Catan & Chill — Bow", category:"Board Games", host:"Jakub Lin", venue:"Draughts Bow", area:"Bow", address:"Bow Wharf, London E3", startOffsetMin:16129, durationMin:150, capacity:26, desc:"Settle Catan, sip something warm, meet new people. Rotating tables so you play with different folks each round."},
  {id:46, title:"Dungeons & Dragons Drop-In", category:"Board Games", host:"Marcus Adeyemi", venue:"The Board Room", area:"Bloomsbury", address:"Russell Square, London WC1B", startOffsetMin:-166, durationMin:188, capacity:32, desc:"Pre-built characters and a one-shot adventure — drop in any week, no commitment needed."},
  {id:47, title:"Weekend Wanderers Walk", category:"Meetups", host:"Mile End Social Club", venue:"The Social Yard", area:"Mile End", address:"Mile End Park, London E3", startOffsetMin:41685, durationMin:105, capacity:40, desc:"A scenic route with regular stops, good for meeting people without the small talk pressure."},
  {id:48, title:"Newcomers Picnic — Acton", category:"Meetups", host:"Acton Social Club", venue:"New Faces Lounge", area:"Acton", address:"Acton Park, London W3", startOffsetMin:-74, durationMin:135, capacity:52, desc:"Blankets on the grass, simple food to share, and an easy way to meet other newcomers."},
  {id:49, title:"Language Exchange Evening", category:"Meetups", host:"Callum Eriksen", venue:"The Gathering Place", area:"Wembley", address:"Wembley Park, London HA9", startOffsetMin:352, durationMin:90, capacity:36, desc:"Practise a new language over coffee, paired up and swapped around through the evening."},
  {id:50, title:"Neighbours Brunch Club", category:"Meetups", host:"Owen Kelly", venue:"The Welcome Table", area:"Pimlico", address:"Pimlico, London SW1V", startOffsetMin:29076, durationMin:105, capacity:36, desc:"A relaxed weekend brunch for locals to get to know whoever's just moved onto the street."},
  {id:51, title:"Book Club Meetup", category:"Meetups", host:"New Cross Social Club", venue:"The Mixer House", area:"New Cross", address:"New Cross Gate, London SE14", startOffsetMin:753, durationMin:150, capacity:46, desc:"This month's pick discussed over snacks — haven't finished it? Come anyway, no spoilers policed too hard."},
  {id:52, title:"New in London Meetup — Wandsworth", category:"Meetups", host:"Chloe Walsh", venue:"Hoxton Square Social", area:"Wandsworth", address:"Wandsworth Town, London SW18", startOffsetMin:24316, durationMin:180, capacity:22, desc:"For anyone who's recently moved to the city. Casual chats, no pressure, just a friendly afternoon outdoors."},
  {id:53, title:"Solo Travellers Social", category:"Meetups", host:"Deptford Social Club", venue:"The Meetup Loft", area:"Deptford", address:"Deptford High Street, London SE8", startOffsetMin:8472, durationMin:135, capacity:28, desc:"For anyone travelling or living solo who fancies some company for an evening."},
  {id:54, title:"Sunday Walk & Talk — Stratford", category:"Meetups", host:"Sienna Greco", venue:"Stratford Community Hub", area:"Stratford", address:"Queen Elizabeth Olympic Park, London E20", startOffsetMin:13887, durationMin:120, capacity:22, desc:"An easy loop with plenty of pauses for conversation — set your own pace and fall in with the group."},
  {id:55, title:"Riverside 5K & Coffee", category:"Meetups", host:"Clerkenwell Social Club", venue:"The Common Room", area:"Clerkenwell", address:"Clerkenwell Green, London EC1R", startOffsetMin:36812, durationMin:120, capacity:26, desc:"A very casual, all-paces run finishing with coffee and pastries at the market. Mostly chatting, barely racing."},
  {id:56, title:"Young Professionals Mixer", category:"Meetups", host:"Barnes Social Club", venue:"Open Door Social Club", area:"Barnes", address:"Barnes Green, London SW13", startOffsetMin:10248, durationMin:150, capacity:46, desc:"Drinks, easy conversation, and a room full of people figuring out the same city you are."},
  {id:57, title:"Career Switchers Coffee Chat", category:"Meetups", host:"Covent Garden Social Club", venue:"Connect Covent Garden", area:"Covent Garden", address:"Covent Garden Piazza, London WC2E", startOffsetMin:10769, durationMin:180, capacity:34, desc:"Swap stories with others rethinking their career path over a relaxed coffee."},
  {id:58, title:"Pasta-Making Workshop", category:"Food & Drink", host:"Priya Fontaine", venue:"The Pop-Up Pantry", area:"Elephant & Castle", address:"Elephant & Castle, London SE1", startOffsetMin:13199, durationMin:135, capacity:50, desc:"Flour-dusted countertops and fresh pasta from scratch, sauce included, mess expected."},
  {id:59, title:"Cheese & Wine Pairing", category:"Food & Drink", host:"Barbican Supper Club", venue:"Spice Route Social", area:"Barbican", address:"Barbican Centre, London EC2Y", startOffsetMin:20120, durationMin:150, capacity:48, desc:"Five pairings guided by a sommelier, picked to make even modest cheese taste special."},
  {id:60, title:"Coffee Cupping Session", category:"Food & Drink", host:"Leyton Supper Club", venue:"Hearth & Home Kitchen", area:"Leyton", address:"Leyton Marsh, London E10", startOffsetMin:1670, durationMin:135, capacity:34, desc:"Smell, slurp, and score your way through a flight of single-origin coffees."},
  {id:61, title:"Vegan Pop-Up Kitchen", category:"Food & Drink", host:"Hackney Supper Club", venue:"The Long Table", area:"Hackney", address:"Hackney Central, London E8", startOffsetMin:18378, durationMin:150, capacity:44, desc:"An all-plant menu proving you don't need meat to make a table happy."},
  {id:62, title:"Wine Tasting Evening", category:"Food & Drink", host:"Camden Supper Club", venue:"Supper House Camden", area:"Camden", address:"Camden Lock, London NW1", startOffsetMin:42160, durationMin:150, capacity:36, desc:"Six pours, a guided tasting, and just enough trivia to sound smarter at your next dinner party."},
  {id:63, title:"Cocktail Masterclass", category:"Food & Drink", host:"Soho Supper Club", venue:"Forktale Kitchen", area:"Soho", address:"Soho Square, London W1D", startOffsetMin:7679, durationMin:120, capacity:40, desc:"Learn the classics and a couple of house originals, shaker in hand the whole night."},
  {id:64, title:"BBQ & Backyard Social — Kentish Town", category:"Food & Drink", host:"Kentish Town Supper Club", venue:"The Cork & Fork", area:"Kentish Town", address:"Kentish Town Road, London NW5", startOffsetMin:38169, durationMin:135, capacity:36, desc:"Smoke rising, drinks flowing, and a garden full of people who came for the food and stayed for the company."},
  {id:65, title:"Craft Beer Tasting Night", category:"Food & Drink", host:"Wimbledon Supper Club", venue:"Ferment & Co.", area:"Wimbledon", address:"Wimbledon Common, London SW19", startOffsetMin:7224, durationMin:120, capacity:36, desc:"A flight of small-batch beers from local breweries, with the brewers on hand to talk through them."},
  {id:66, title:"Bake-Off Social Night", category:"Food & Drink", host:"Canary Wharf Supper Club", venue:"Market Table Canary Wharf", area:"Canary Wharf", address:"Canada Square Park, London E14", startOffsetMin:28719, durationMin:150, capacity:42, desc:"Bring something you baked, taste everyone else's, vote without too much bias."},
  {id:67, title:"Supper Club — Fulham", category:"Food & Drink", host:"Fulham Supper Club", venue:"The Tasting Room", area:"Fulham", address:"Fulham Broadway, London SW6", startOffsetMin:37907, durationMin:165, capacity:26, desc:"A set menu shared family-style with strangers who won't stay strangers for long."},
  {id:68, title:"Sunday Roast Social", category:"Food & Drink", host:"Priya Costa", venue:"The Tasting Bar", area:"Angel", address:"Angel, London EC1V", startOffsetMin:34193, durationMin:120, capacity:46, desc:"All the trimmings, shared tables, and seconds always on offer."},
  {id:69, title:"Acoustic Sessions — Borough", category:"Live Music", host:"Borough Music Collective", venue:"Sessions House Borough", area:"Borough", address:"Borough Market, London SE1", startOffsetMin:20389, durationMin:180, capacity:78, desc:"Stripped-back sets from local songwriters in a room built for quiet attention."},
  {id:70, title:"Drum & Bass Warehouse Session", category:"Live Music", host:"Marylebone Music Collective", venue:"Vinyl & Verse", area:"Marylebone", address:"Marylebone High Street, London W1U", startOffsetMin:19496, durationMin:165, capacity:80, desc:"Heavy bass, low light, a proper warehouse sound system pushed right to the edge."},
  {id:71, title:"Busking Showcase — Brixton", category:"Live Music", host:"Brixton Music Collective", venue:"Lowkey Lounge", area:"Brixton", address:"Brixton Market, London SW9", startOffsetMin:24967, durationMin:165, capacity:64, desc:"Street performers given an actual stage and a crowd that came specifically to listen."},
  {id:72, title:"Singer-Songwriter Showcase", category:"Live Music", host:"Dalston Music Collective", venue:"The Soundbox", area:"Dalston", address:"Dalston Square, London E8", startOffsetMin:37416, durationMin:180, capacity:62, desc:"A rotating bill of new voices getting their first stage time in front of a friendly crowd."},
  {id:73, title:"Jazz in the Park", category:"Live Music", host:"Lucas Eriksen", venue:"The Listening Room", area:"Herne Hill", address:"Brockwell Park, London SE24", startOffsetMin:18923, durationMin:150, capacity:40, desc:"Bring a blanket, the band sets up as the sun goes down, no amps needed."},
  {id:74, title:"Sunday Jazz Brunch", category:"Live Music", host:"Noah Singh", venue:"Resonance Hall", area:"Chelsea", address:"Chelsea Embankment, London SW3", startOffsetMin:30593, durationMin:150, capacity:122, desc:"Brunch plates out, a trio playing soft sets, a lazy Sunday done right."},
  {id:75, title:"Open Mic Night — Bermondsey", category:"Live Music", host:"Freya Kowalski", venue:"The Hidden String", area:"Bermondsey", address:"Bermondsey Street, London SE1", startOffsetMin:11240, durationMin:210, capacity:100, desc:"Sign up on the night, play two songs, get a room that actually listens."},
  {id:76, title:"Folk Music Circle", category:"Live Music", host:"Lewisham Music Collective", venue:"The Amp Room", area:"Lewisham", address:"Lewisham High Street, London SE13", startOffsetMin:41600, durationMin:180, capacity:76, desc:"Pull out an instrument or just hum along — tunes passed around the circle all night."},
  {id:77, title:"Indie Gig Night", category:"Live Music", host:"Clapham Music Collective", venue:"Echo Chamber Clapham", area:"Clapham", address:"Clapham Common, London SW4", startOffsetMin:15512, durationMin:210, capacity:50, desc:"Three local bands, one small stage, and a crowd that actually came for the music."},
  {id:78, title:"Vinyl Listening Party", category:"Live Music", host:"Hammersmith Music Collective", venue:"Backroom Sessions", area:"Hammersmith", address:"Hammersmith Broadway, London W6", startOffsetMin:13170, durationMin:210, capacity:68, desc:"Bring a record, take a turn on the deck, talk about why it matters to you."},
  {id:79, title:"Live Band Karaoke", category:"Live Music", host:"Priya Hassan", venue:"The Note Room", area:"Bethnal Green", address:"Bethnal Green Gardens, London E2", startOffsetMin:4892, durationMin:180, capacity:100, desc:"A real band behind you instead of a backing track — braver karaoke for braver singers."},
  {id:80, title:"Forest Bathing Walk", category:"Wellness & Outdoors", host:"Vauxhall Wellness Co-op", venue:"Earthbound Studio", area:"Vauxhall", address:"Vauxhall Pleasure Gardens, London SW8", startOffsetMin:27982, durationMin:60, capacity:39, desc:"A slow, deliberate walk through the trees, phones away, senses on."},
  {id:81, title:"Sunrise Yoga — Stoke Newington", category:"Wellness & Outdoors", host:"Joel Adeyemi", venue:"The Stillness Studio", area:"Stoke Newington", address:"Clissold Park, London N16", startOffsetMin:16451, durationMin:120, capacity:15, desc:"Mats out before the city wakes up — gentle flow followed by a quiet coffee together."},
  {id:82, title:"Sound Bath & Meditation", category:"Wellness & Outdoors", host:"Greenwich Wellness Co-op", venue:"The Breathing Room", area:"Greenwich", address:"Greenwich Park, London SE10", startOffsetMin:8858, durationMin:105, capacity:17, desc:"Lie back, let the bowls do the work, and leave lighter than you arrived."},
  {id:83, title:"Outdoor Bootcamp Session", category:"Wellness & Outdoors", host:"Fitzrovia Wellness Co-op", venue:"The Calm Space", area:"Fitzrovia", address:"Fitzrovia, London W1T", startOffsetMin:-153, durationMin:254, capacity:35, desc:"Bodyweight circuits scaled to whoever shows up — no equipment, no excuses."},
  {id:84, title:"Park Run Social — Tooting", category:"Wellness & Outdoors", host:"Tooting Wellness Co-op", venue:"Tooting Wellness Collective", area:"Tooting", address:"Tooting Common, London SW17", startOffsetMin:33201, durationMin:120, capacity:29, desc:"An easy group run finishing with stretches and a proper catch-up after."},
  {id:85, title:"Stretch & Connect Social", category:"Wellness & Outdoors", host:"Lucas Adeyemi", venue:"Pathway Studio", area:"Balham", address:"Balham High Road, London SW12", startOffsetMin:29615, durationMin:105, capacity:19, desc:"Light movement, easy conversation, and a proper excuse to get off the sofa."},
  {id:86, title:"Pilates in the Park", category:"Wellness & Outdoors", host:"Ines Eriksen", venue:"The Grounding Place", area:"Dulwich", address:"Dulwich Park, London SE21", startOffsetMin:-143, durationMin:287, capacity:35, desc:"Mat work suited to all levels, fresh air doing half the work for you."},
  {id:87, title:"Community Garden Volunteer Day", category:"Wellness & Outdoors", host:"Battersea Wellness Co-op", venue:"The Mindful Room", area:"Battersea", address:"Battersea Park, London SW11", startOffsetMin:5197, durationMin:105, capacity:23, desc:"Get your hands dirty for an afternoon, then sit down together for tea after."},
  {id:88, title:"Wild Swimming Meetup", category:"Wellness & Outdoors", host:"Wood Green Wellness Co-op", venue:"Roots & Branches Studio", area:"Wood Green", address:"Wood Green High Road, London N22", startOffsetMin:-95, durationMin:196, capacity:21, desc:"Hardy regulars and curious first-timers both welcome, towels and tea provided after."},
  {id:89, title:"Nature Walk & Journaling", category:"Wellness & Outdoors", host:"King's Cross Wellness Co-op", venue:"Open Air Wellness Hub", area:"King's Cross", address:"King's Cross, London N1C", startOffsetMin:10004, durationMin:75, capacity:17, desc:"A slow loop with stops to write down whatever the walk brings up."},
  {id:90, title:"Mindfulness Morning — Muswell Hill", category:"Wellness & Outdoors", host:"Chloe Costa", venue:"The Renewal Room", area:"Muswell Hill", address:"Alexandra Park, London N10", startOffsetMin:-116, durationMin:240, capacity:21, desc:"Ten quiet minutes together before the day picks up speed."},
  {id:91, title:"Hack Night — Whitechapel", category:"Tech & Talks", host:"Ravi Davies", venue:"The Build Space", area:"Whitechapel", address:"Whitechapel Road, London E1", startOffsetMin:27580, durationMin:135, capacity:78, desc:"Bring a laptop and a problem, leave with a prototype and a few new collaborators."},
  {id:92, title:"Data Nerds Social", category:"Tech & Talks", host:"Kingston Tech Circle", venue:"The Lightning Room", area:"Kingston", address:"Kingston Riverside, London KT1", startOffsetMin:39654, durationMin:150, capacity:76, desc:"Bring a dataset or just bring opinions about one — either way, good conversation guaranteed."},
  {id:93, title:"Startup Pitch Night", category:"Tech & Talks", host:"Hampstead Tech Circle", venue:"The Innovation Room", area:"Hampstead", address:"Hampstead Heath, London NW3", startOffsetMin:18007, durationMin:105, capacity:60, desc:"Three founders, five minutes each, and a room of people happy to ask hard questions."},
  {id:94, title:"No-Code Builders Meetup", category:"Tech & Talks", host:"Leo Murphy", venue:"Signal Space", area:"Farringdon", address:"Farringdon Road, London EC1M", startOffsetMin:26617, durationMin:165, capacity:50, desc:"Show off what you built without writing a line of code, swap tools and tips."},
  {id:95, title:"Future of Work Roundtable", category:"Tech & Talks", host:"Mayfair Tech Circle", venue:"Beta Lounge", area:"Mayfair", address:"Berkeley Square, London W1J", startOffsetMin:8484, durationMin:135, capacity:82, desc:"An open discussion on how working life keeps shifting, and what to do about it."},
  {id:96, title:"Women in Tech Mixer", category:"Tech & Talks", host:"Forest Hill Tech Circle", venue:"Circuit Social", area:"Forest Hill", address:"Horniman Gardens, London SE23", startOffsetMin:25942, durationMin:90, capacity:64, desc:"A relaxed evening built around the people too often missing from the room."},
  {id:97, title:"AI & Coffee Meetup", category:"Tech & Talks", host:"Tottenham Tech Circle", venue:"Hack House Tottenham", area:"Tottenham", address:"Tottenham High Road, London N17", startOffsetMin:5621, durationMin:90, capacity:72, desc:"Casual chat over coffee about what's actually changing day to day, no hype required."},
  {id:98, title:"Lightning Talks Night — Crouch End", category:"Tech & Talks", host:"Crouch End Tech Circle", venue:"The Founders' Loft", area:"Crouch End", address:"Crouch End Broadway, London N8", startOffsetMin:30377, durationMin:180, capacity:38, desc:"Five-minute talks, no slides required, on whatever someone's been building lately."},
  {id:99, title:"Product Show & Tell", category:"Tech & Talks", host:"Jakub Murphy", venue:"The Pitch Room", area:"Croydon", address:"Croydon Town Centre, London CR0", startOffsetMin:29919, durationMin:105, capacity:50, desc:"A rotating lineup of builders showing what they shipped this month."},
  {id:100, title:"Open Source Contributors Meetup", category:"Tech & Talks", host:"Theo Wright", venue:"Code & Coffee House", area:"Islington", address:"Islington Green, London N1", startOffsetMin:27747, durationMin:180, capacity:78, desc:"Find a project, pick up an issue, pair with someone who knows the codebase."},
];

// Anchor to UTC midnight of today — same reference point on every device
const _d = new Date(); const DAY_EPOCH = Date.UTC(_d.getUTCFullYear(), _d.getUTCMonth(), _d.getUTCDate());

const EVENTS = EVENT_SEED.map(seed => ({
  id: seed.id, title: seed.title, category: seed.category, host: seed.host,
  venue: seed.venue, area: seed.area, address: seed.address,
  lat: null, lon: null,
  startTime: new Date(DAY_EPOCH + seed.startOffsetMin*60000).toISOString(),
  endTime: new Date(DAY_EPOCH + (seed.startOffsetMin + seed.durationMin)*60000).toISOString(),
  capacity: seed.capacity, desc: seed.desc
}));

// Category palette — distinct, harmonious, no purple/indigo/violet.
// Used only as scannability accents (dots, badges, markers, borders);
// all interactive chrome (buttons/nav/CTAs) stays yellow.
const CATS = {
  "Creative":{color:"#CBA43A"},            // gold
  "Gaming":{color:"#35C98A"},              // emerald
  "Movie Nights":{color:"#F0913E"},        // orange
  "Board Games":{color:"#2FB6C4"},         // teal
  "Meetups":{color:"#E85BA0"},             // pink
  "Food & Drink":{color:"#E85641"},        // red
  "Live Music":{color:"#F0687E"},          // rose
  "Wellness & Outdoors":{color:"#8FC63D"}, // lime
  "Tech & Talks":{color:"#4F9BE8"}         // blue
};

// Category → representative photo (Unsplash, free license). Presentation only.
const CAT_IMG = {
  "Creative":"1513364776144-60967b0f800f",
  "Gaming":"1511512578047-dfb367046420",
  "Movie Nights":"1489599849927-2ee91cede3ba",
  "Board Games":"1610890716171-6b1bb98ffd09",
  "Meetups":"1523580494863-6f3031224c94",
  "Food & Drink":"1414235077428-338989a2e8c0",
  "Live Music":"1470229722913-7c0e2dbbafd3",
  "Wellness & Outdoors":"1544367567-0f2fcb009e0b",
  "Tech & Talks":"1475721027785-f74eccf877e2"
};
function catImg(cat){ const id=CAT_IMG[cat]||"1517457373958-b7bdd4587205"; return `https://images.unsplash.com/photo-${id}?w=900&q=72&auto=format&fit=crop`; }

function eventStatus(ev){ const now=Date.now(); if(now>=ev.startsAt&&now<=ev.endsAt) return 'live'; if(now<ev.startsAt) return 'upcoming'; return 'past'; }
function isHotEvent(ev){ const st=eventStatus(ev); if(st==='past') return false; if(st==='live') return true; return attendeesFor(ev.id).length>=2; }
function generateUniqueId(){ return Math.floor(Math.random()*1000000).toString().padStart(6,'0'); }
function codeFor(name,id){ const c=name.toUpperCase().replace(/\s+/g,'-').replace(/[^A-Z0-9-]/g,''); return `CUMULUS-FRIEND::${c}-${id}`; }

const DEMO_PEOPLE = [
  {name:"Alex Rivera", id:"849201", events:[3,11,61,70,96], blurb:"Watercolours and board games. Always brings snacks."},
  {name:"Priya Shah", id:"102934", events:[9,29,45,84], blurb:"New to London, up for almost anything social."},
  {name:"Tom Becker", id:"582910", events:[4,26,32,97], blurb:"Retro gaming obsessive, pinball wizard."},
  {name:"Mei Lin", id:"392105", events:[17,20,31,80], blurb:"Ceramics, sketching and very strong tea."},
  {name:"Jordan Cole", id:"994021", events:[15,28,60,73,86], blurb:"Film buff and certified A24 superfan."},
  {name:"Sam Okafor", id:"223019", events:[22,48,78,96,99], blurb:"Strategy games strategist. Will teach you."},
  {name:"Nadia Hassan", id:"774812", events:[14,21,40,100], blurb:"Here to meet people and try new things."},
  {name:"Owen Wright", id:"110293", events:[40,49,74,87], blurb:"Arcades, indie films and good company."},
  {name:"Chloe Davies", id:"450912", events:[10,26,76,89,92], blurb:"Running, sketching, and exploring new boroughs."},
  {name:"Marcus King", id:"660192", events:[14,39,90,99], blurb:"Hardstuck in ranked, here to watch the pros instead."},
];
DEMO_PEOPLE.forEach(p=>p.code=codeFor(p.name,p.id));
function personByName(n){ return DEMO_PEOPLE.find(p=>p.name===n); }

// ─── Background Styles (50+) — the gradient/texture of the card ─────────────
const CARD_BG_STYLES = [
  // ── Dark Tones ──
  {id:'midnight',      name:'Midnight',       bg:'linear-gradient(145deg,#090b14 0%,#0f1729 55%,#1a2744 100%)', dark:true},
  {id:'obsidian',      name:'Obsidian',       bg:'linear-gradient(145deg,#0a0a0a 0%,#1a1a1a 55%,#2d2d2d 100%)', dark:true},
  {id:'charcoal',      name:'Charcoal',       bg:'linear-gradient(145deg,#1c1c1e 0%,#2c2c2e 55%,#3a3a3c 100%)', dark:true},
  {id:'slate',         name:'Slate',          bg:'linear-gradient(145deg,#0f172a 0%,#1e293b 55%,#334155 100%)', dark:true},
  {id:'ink',           name:'Ink',            bg:'linear-gradient(145deg,#13111c 0%,#211d30 55%,#2d2840 100%)', dark:true},
  {id:'abyss',         name:'Abyss',          bg:'linear-gradient(145deg,#030712 0%,#0a0f1e 55%,#111827 100%)', dark:true},
  {id:'noir',          name:'Noir',           bg:'linear-gradient(145deg,#0a0a0c 0%,#15151a 55%,#1f1f27 100%)', dark:true},
  {id:'volcanic',      name:'Volcanic',       bg:'linear-gradient(145deg,#1a0505 0%,#2d0a0a 55%,#3d1212 100%)', dark:true},
  {id:'cosmos',        name:'Cosmos',         bg:'linear-gradient(145deg,#050212 0%,#0d0625 55%,#130a38 100%)', dark:true},
  {id:'carbon',        name:'Carbon',         bg:'linear-gradient(145deg,#111 0%,#1e1e1e 40%,#252525 60%,#1a1a1a 100%)', dark:true},
  {id:'graphite',      name:'Graphite',       bg:'linear-gradient(145deg,#1f2023 0%,#2a2b2f 55%,#36373d 100%)', dark:true},
  {id:'pitch',         name:'Pitch',          bg:'linear-gradient(145deg,#06060a 0%,#0e0e14 55%,#18181e 100%)', dark:true},
  {id:'nightfall',     name:'Nightfall',      bg:'linear-gradient(145deg,#0d0e1a 0%,#161730 55%,#1f2044 100%)', dark:true},
  {id:'anthracite',    name:'Anthracite',     bg:'linear-gradient(145deg,#181a1d 0%,#24272c 55%,#303540 100%)', dark:true},
  {id:'void',          name:'Void',           bg:'linear-gradient(145deg,#020204 0%,#060608 55%,#0a0a0e 100%)', dark:true},
  // ── Light Tones ──
  {id:'cloud',         name:'Cloud',          bg:'linear-gradient(145deg,#f8fafc 0%,#e8f0fe 55%,#dbeafe 100%)', dark:false},
  {id:'pearl',         name:'Pearl',          bg:'linear-gradient(145deg,#fefefe 0%,#f5f5f5 55%,#ebebeb 100%)', dark:false},
  {id:'cream',         name:'Cream',          bg:'linear-gradient(145deg,#fffef7 0%,#faf8ef 55%,#f5f2e3 100%)', dark:false},
  {id:'cotton',        name:'Cotton',         bg:'linear-gradient(145deg,#fdfcff 0%,#f3efff 55%,#ede8ff 100%)', dark:false},
  {id:'frost',         name:'Frost',          bg:'linear-gradient(145deg,#f0f9ff 0%,#e0f2fe 55%,#bae6fd 100%)', dark:false},
  {id:'linen-bg',      name:'Linen',          bg:'linear-gradient(145deg,#faf9f7 0%,#f2efea 55%,#e8e2d8 100%)', dark:false},
  {id:'chalk',         name:'Chalk',          bg:'linear-gradient(145deg,#f8f8f6 0%,#eeede8 55%,#e2e0d8 100%)', dark:false},
  {id:'mist',          name:'Mist',           bg:'linear-gradient(145deg,#e2e8f0 0%,#cbd5e1 50%,#e0e7ff 100%)', dark:false},
  {id:'blush',         name:'Blush',          bg:'linear-gradient(145deg,#fff0f3 0%,#ffe4e9 55%,#ffd6de 100%)', dark:false},
  {id:'sage-light',    name:'Sage',           bg:'linear-gradient(145deg,#f0fdf4 0%,#dcfce7 55%,#bbf7d0 100%)', dark:false},
  {id:'snow',          name:'Snow',           bg:'linear-gradient(145deg,#ffffff 0%,#f9fafb 55%,#f1f3f6 100%)', dark:false},
  {id:'ivory',         name:'Ivory',          bg:'linear-gradient(145deg,#fffff4 0%,#fdfde6 55%,#fafad0 100%)', dark:false},
  {id:'eggshell',      name:'Eggshell',       bg:'linear-gradient(145deg,#f5f0e8 0%,#ede4d2 55%,#e4d8c2 100%)', dark:false},
  {id:'lilac-mist',    name:'Lilac Mist',     bg:'linear-gradient(145deg,#f8f0ff 0%,#f0e0ff 55%,#e8ccff 100%)', dark:false},
  {id:'peach-mist',    name:'Peach Mist',     bg:'linear-gradient(145deg,#fff5f0 0%,#feecd6 55%,#fde0c0 100%)', dark:false},
  // ── Rich & Deep ──
  {id:'ocean',         name:'Ocean',          bg:'linear-gradient(145deg,#0c1f3f 0%,#0e3460 55%,#124a80 100%)', dark:true},
  {id:'forest',        name:'Forest',         bg:'linear-gradient(145deg,#052e16 0%,#14532d 55%,#166534 100%)', dark:true},
  {id:'cherry',        name:'Cherry',         bg:'linear-gradient(145deg,#3b0012 0%,#5c0020 55%,#7f0030 100%)', dark:true},
  {id:'cobalt',        name:'Cobalt',         bg:'linear-gradient(145deg,#0a1628 0%,#172554 55%,#1e3a8a 100%)', dark:true},
  {id:'jade',          name:'Jade',           bg:'linear-gradient(145deg,#042f2e 0%,#134e4a 55%,#115e59 100%)', dark:true},
  {id:'amber-dark',    name:'Amber',          bg:'linear-gradient(145deg,#1c1200 0%,#2d1d00 55%,#3d2800 100%)', dark:true},
  {id:'plum',          name:'Plum',           bg:'linear-gradient(145deg,#2e1065 0%,#4a1d96 55%,#5b21b6 100%)', dark:true},
  {id:'crimson',       name:'Crimson',        bg:'linear-gradient(145deg,#450a0a 0%,#7f1d1d 55%,#991b1b 100%)', dark:true},
  {id:'denim',         name:'Denim',          bg:'linear-gradient(145deg,#1d2438 0%,#2d3655 55%,#374469 100%)', dark:true},
  {id:'copper-bg',     name:'Copper',         bg:'linear-gradient(145deg,#1c0f08 0%,#2d1a0e 55%,#40251a 100%)', dark:true},
  {id:'burgundy',      name:'Burgundy',       bg:'linear-gradient(145deg,#2d0a1f 0%,#4a1030 55%,#6b1840 100%)', dark:true},
  {id:'pine',          name:'Pine',           bg:'linear-gradient(145deg,#0c2b16 0%,#1a4a2a 55%,#1e5c34 100%)', dark:true},
  {id:'aubergine',     name:'Aubergine',      bg:'linear-gradient(145deg,#1e0a2a 0%,#32104a 55%,#4a1870 100%)', dark:true},
  {id:'mahogany',      name:'Mahogany',       bg:'linear-gradient(145deg,#2a0e08 0%,#401812 55%,#5a2820 100%)', dark:true},
  {id:'steel-dark',    name:'Steel',          bg:'linear-gradient(145deg,#0c1f38 0%,#162d50 55%,#203e6a 100%)', dark:true},
  // ── Gradient Moods ──
  {id:'aurora',        name:'Aurora',         bg:'linear-gradient(145deg,#022c22 0%,#064e3b 35%,#065f46 65%,#0a4a5e 100%)', dark:true},
  {id:'sunset',        name:'Sunset',         bg:'linear-gradient(145deg,#3b1a2c 0%,#7f1d41 35%,#c2410c 70%,#d97706 100%)', dark:true},
  {id:'twilight',      name:'Twilight',       bg:'linear-gradient(145deg,#1e1b4b 0%,#3730a3 40%,#6d28d9 70%,#be185d 100%)', dark:true},
  {id:'deepspace',     name:'Deep Space',     bg:'linear-gradient(145deg,#010409 0%,#030d1a 35%,#0a1628 65%,#0c0f2e 100%)', dark:true},
  {id:'summer',        name:'Summer',         bg:'linear-gradient(145deg,#fffde0 0%,#fef9c3 40%,#fde68a 70%,#fbbf24 100%)', dark:false},
  {id:'arctic',        name:'Arctic',         bg:'linear-gradient(145deg,#ecfeff 0%,#cffafe 40%,#a5f3fc 70%,#67e8f9 100%)', dark:false},
  {id:'jungle',        name:'Jungle',         bg:'linear-gradient(145deg,#052e16 0%,#064e3b 40%,#065f46 70%,#047857 100%)', dark:true},
  {id:'lagoon',        name:'Lagoon',         bg:'linear-gradient(145deg,#0c4a6e 0%,#0369a1 40%,#0284c7 70%,#38bdf8 100%)', dark:true},
  {id:'fire',          name:'Fire',           bg:'linear-gradient(145deg,#450a0a 0%,#7f1d1d 30%,#b91c1c 60%,#ef4444 90%,#fbbf24 100%)', dark:true},
  {id:'violet-storm',  name:'V. Storm',       bg:'linear-gradient(145deg,#1e1b4b 0%,#312e81 40%,#4338ca 70%,#6366f1 100%)', dark:true},
  {id:'ember',         name:'Ember',          bg:'linear-gradient(145deg,#1c0800 0%,#43100a 40%,#7c2d12 70%,#c2410c 100%)', dark:true},
  {id:'northern-lights',name:'N. Lights',    bg:'linear-gradient(145deg,#0a1f0a 0%,#063a2c 35%,#0a4a5e 65%,#1e1b4b 100%)', dark:true},
  {id:'galaxy',        name:'Galaxy',         bg:'linear-gradient(145deg,#03001e 0%,#1a0533 35%,#0d0533 65%,#030014 100%)', dark:true},
  {id:'bloom',         name:'Bloom',          bg:'linear-gradient(145deg,#fdf2f8 0%,#fce7f3 40%,#fbcfe8 70%,#f9a8d4 100%)', dark:false},
  {id:'citrus',        name:'Citrus',         bg:'linear-gradient(145deg,#fefce8 0%,#fef9c3 40%,#fef08a 70%,#fdba74 100%)', dark:false},
  {id:'rose-gold',     name:'Rose Gold',      bg:'linear-gradient(145deg,#fff1f1 0%,#ffe0e6 40%,#ffd0db 70%,#ffc0cc 100%)', dark:false},
  {id:'forest-floor',  name:'Forest Floor',   bg:'linear-gradient(145deg,#1c2518 0%,#243320 55%,#2d4028 100%)', dark:true},
  {id:'prism',         name:'Prism',          bg:'linear-gradient(145deg,#0f0030 0%,#220058 30%,#3c0070 65%,#180050 100%)', dark:true},
  {id:'vapor',         name:'Vapor',          bg:'linear-gradient(145deg,#18002c 0%,#2a0055 35%,#4a0888 65%,#1a0840 100%)', dark:true},
  {id:'mango-glow',    name:'Mango',          bg:'linear-gradient(145deg,#fffbe8 0%,#fff3c4 40%,#ffd870 70%,#ffb020 100%)', dark:false},
  {id:'midnight-ocean',name:'M. Ocean',       bg:'linear-gradient(145deg,#000528 0%,#001a55 35%,#004e92 70%,#000428 100%)', dark:true},
  {id:'magma',         name:'Magma',          bg:'linear-gradient(145deg,#1a0000 0%,#3d0000 35%,#7a1500 65%,#c45000 100%)', dark:true},
  {id:'royal-purple',  name:'Royal',          bg:'linear-gradient(145deg,#0a0030 0%,#160055 40%,#2200a0 70%,#3000c8 100%)', dark:true},
  {id:'deep-teal',     name:'Deep Teal',      bg:'linear-gradient(145deg,#002028 0%,#004050 35%,#006070 65%,#008090 100%)', dark:true},
  {id:'spring',        name:'Spring',         bg:'linear-gradient(145deg,#f0ffe8 0%,#d4f7b8 40%,#a8ef80 70%,#7be048 100%)', dark:false},
  {id:'arctic-dawn',   name:'Arctic Dawn',    bg:'linear-gradient(145deg,#c8f0ff 0%,#92d8f8 40%,#58b8e8 70%,#2898d8 100%)', dark:false},
  {id:'amethyst',      name:'Amethyst',       bg:'linear-gradient(145deg,#160030 0%,#2c0055 35%,#3e0070 65%,#4a0088 100%)', dark:true},
  {id:'deep-rose',     name:'Deep Rose',      bg:'linear-gradient(145deg,#1e0016 0%,#3a0030 35%,#5a0050 65%,#780060 100%)', dark:true},
  {id:'peach-glow',    name:'Peach Glow',     bg:'linear-gradient(145deg,#fff0e8 0%,#ffe0c8 40%,#ffc8a0 70%,#ffb080 100%)', dark:false},
  {id:'forest-night',  name:'Forest Night',   bg:'linear-gradient(145deg,#051a10 0%,#0a2e1c 40%,#0f3c26 70%,#134c30 100%)', dark:true},
  // ── Cloud Classics ──
  {id:'storm',         name:'Storm',          bg:'linear-gradient(145deg,#0f1729 0%,#1a3356 55%,#243b55 100%)', dark:true},
  {id:'nimbus',        name:'Nimbus',         bg:'linear-gradient(145deg,#0c1445 0%,#1a237e 55%,#283593 100%)', dark:true},
  {id:'electric',      name:'Electric',       bg:'linear-gradient(145deg,#fffbeb 0%,#fef3c7 50%,#fefce8 100%)', dark:false},
  {id:'thunder',       name:'Thunder',        bg:'linear-gradient(145deg,#18181b 0%,#27272a 55%,#3f3f46 100%)', dark:true},
  {id:'cirrus',        name:'Cirrus',         bg:'linear-gradient(145deg,#e0f2fe 0%,#bae6fd 50%,#e0f2fe 100%)', dark:false},
  {id:'dusk',          name:'Dusk',           bg:'linear-gradient(145deg,#1a1a2e 0%,#16213e 55%,#0f3460 100%)', dark:true},
  {id:'overcast',      name:'Overcast',       bg:'linear-gradient(145deg,#9ca3af 0%,#d1d5db 55%,#e5e7eb 100%)', dark:false},
  {id:'haze',          name:'Haze',           bg:'linear-gradient(145deg,#c0c9d8 0%,#d8e0ea 55%,#eaeef4 100%)', dark:false},
  {id:'squall',        name:'Squall',         bg:'linear-gradient(145deg,#1c2440 0%,#2a3458 55%,#3a4670 100%)', dark:true},
  {id:'altitude',      name:'Altitude',       bg:'linear-gradient(145deg,#f0f6ff 0%,#e0eeff 55%,#cce0ff 100%)', dark:false},
  // ── Vintage & Warm ──
  {id:'sepia',         name:'Sepia',          bg:'linear-gradient(145deg,#2a1e0a 0%,#3d2c14 55%,#4e3920 100%)', dark:true},
  {id:'warm-stone',    name:'Warm Stone',     bg:'linear-gradient(145deg,#f5ede0 0%,#ecdbc4 55%,#e0c9a8 100%)', dark:false},
  {id:'terracotta-bg', name:'Terracotta',     bg:'linear-gradient(145deg,#1c0e08 0%,#341610 55%,#4a1e16 100%)', dark:true},
  {id:'parchment',     name:'Parchment',      bg:'linear-gradient(145deg,#faf5e4 0%,#f5edd0 55%,#eee3bc 100%)', dark:false},
  {id:'antique',       name:'Antique',        bg:'linear-gradient(145deg,#f0e8d0 0%,#e8dac0 55%,#dccaaa 100%)', dark:false},
  {id:'washed-denim',  name:'Washed Denim',   bg:'linear-gradient(145deg,#c8d8e8 0%,#b8c8d8 55%,#a8b8c8 100%)', dark:false},
  {id:'dusty-rose',    name:'Dusty Rose',     bg:'linear-gradient(145deg,#f0dcd8 0%,#e8cac6 55%,#ddb8b4 100%)', dark:false},
  {id:'harvest',       name:'Harvest',        bg:'linear-gradient(145deg,#1e1000 0%,#342000 55%,#4a3000 100%)', dark:true},
  {id:'cedar',         name:'Cedar',          bg:'linear-gradient(145deg,#1a0e08 0%,#2e1a10 55%,#3e2618 100%)', dark:true},
  {id:'tobacco',       name:'Tobacco',        bg:'linear-gradient(145deg,#241408 0%,#382210 55%,#4a3018 100%)', dark:true},
  {id:'wheat',         name:'Wheat',          bg:'linear-gradient(145deg,#fef8ec 0%,#faf0d4 55%,#f5e6bc 100%)', dark:false},
  {id:'clay',          name:'Clay',           bg:'linear-gradient(145deg,#1e1208 0%,#32200e 55%,#442e14 100%)', dark:true},
  {id:'bourbon',       name:'Bourbon',        bg:'linear-gradient(145deg,#1c0e00 0%,#301800 55%,#402400 100%)', dark:true},
  {id:'sand-dune',     name:'Sand Dune',      bg:'linear-gradient(145deg,#f0e8d0 0%,#e8d8b8 55%,#dcc89e 100%)', dark:false},
  {id:'amber-cream',   name:'Amber Cream',    bg:'linear-gradient(145deg,#fffaee 0%,#fef5d8 55%,#fce8b8 100%)', dark:false},
];

// ─── Accent Colors (50+) — the highlight color on the card ──────────────────
const CARD_ACCENT_COLORS = [
  // Blues
  {id:'sky',          name:'Sky',          hex:'#38BDF8'},
  {id:'blue',         name:'Blue',         hex:'#3B82F6'},
  {id:'cobalt-ac',    name:'Cobalt',       hex:'#2563EB'},
  {id:'sapphire',     name:'Sapphire',     hex:'#1D4ED8'},
  {id:'navy',         name:'Navy',         hex:'#1E40AF'},
  {id:'ice',          name:'Ice',          hex:'#BAE6FD'},
  {id:'periwinkle',   name:'Periwinkle',   hex:'#818CF8'},
  {id:'cerulean',     name:'Cerulean',     hex:'#06B6D4'},
  {id:'steel',        name:'Steel',        hex:'#7B9FD4'},
  {id:'powder',       name:'Powder',       hex:'#93C5FD'},
  {id:'azure',        name:'Azure',        hex:'#0EA5E9'},
  {id:'denim-ac',     name:'Denim',        hex:'#3B5E9E'},
  {id:'ocean-ac',     name:'Ocean',        hex:'#0369A1'},
  {id:'cobalt-light', name:'Cobalt Lt',    hex:'#60A5FA'},
  {id:'powder-deep',  name:'Powder Deep',  hex:'#7DD3FC'},
  // Purples
  {id:'violet',       name:'Violet',       hex:'#7C3AED'},
  {id:'purple',       name:'Purple',       hex:'#9333EA'},
  {id:'lavender',     name:'Lavender',     hex:'#A78BFA'},
  {id:'indigo',       name:'Indigo',       hex:'#6366F1'},
  {id:'grape',        name:'Grape',        hex:'#6D28D9'},
  {id:'mauve',        name:'Mauve',        hex:'#C084FC'},
  {id:'lilac',        name:'Lilac',        hex:'#DDD6FE'},
  {id:'heather',      name:'Heather',      hex:'#8B5CF6'},
  {id:'amethyst-ac',  name:'Amethyst',     hex:'#7C2D92'},
  {id:'byzantium',    name:'Byzantium',    hex:'#5C2D91'},
  {id:'wisteria',     name:'Wisteria',     hex:'#BFA2DB'},
  {id:'aubergine-ac', name:'Aubergine',    hex:'#4B0082'},
  {id:'orchid-ac',    name:'Orchid',       hex:'#DA70D6'},
  // Pinks & Reds
  {id:'hot-pink',     name:'Hot Pink',     hex:'#EC4899'},
  {id:'rose-ac',      name:'Rose',         hex:'#F43F5E'},
  {id:'crimson-ac',   name:'Crimson',      hex:'#DC2626'},
  {id:'coral',        name:'Coral',        hex:'#FB7185'},
  {id:'blush-ac',     name:'Blush',        hex:'#FDA4AF'},
  {id:'magenta',      name:'Magenta',      hex:'#D946EF'},
  {id:'scarlet',      name:'Scarlet',      hex:'#EF4444'},
  {id:'flamingo',     name:'Flamingo',     hex:'#FF6B9D'},
  {id:'salmon',       name:'Salmon',       hex:'#FA8072'},
  {id:'ruby',         name:'Ruby',         hex:'#BE123C'},
  {id:'candy',        name:'Candy',        hex:'#FF69B4'},
  {id:'cherry-ac',    name:'Cherry',       hex:'#C0392B'},
  {id:'bubblegum',    name:'Bubblegum',    hex:'#FF85C0'},
  {id:'cerise',       name:'Cerise',       hex:'#DE3163'},
  {id:'carnation',    name:'Carnation',    hex:'#FFA0B4'},
  // Oranges & Yellows
  {id:'amber',        name:'Amber',        hex:'#FBBF24'},
  {id:'gold',         name:'Gold',         hex:'#F59E0B'},
  {id:'tangerine',    name:'Tangerine',    hex:'#F97316'},
  {id:'peach',        name:'Peach',        hex:'#FED7AA'},
  {id:'copper-ac',    name:'Copper',       hex:'#B45309'},
  {id:'honey',        name:'Honey',        hex:'#FDE68A'},
  {id:'sunshine',     name:'Sunshine',     hex:'#EAB308'},
  {id:'butter',       name:'Butter',       hex:'#FEF08A'},
  {id:'saffron',      name:'Saffron',      hex:'#CA8A04'},
  {id:'apricot',      name:'Apricot',      hex:'#FFAD60'},
  {id:'mustard',      name:'Mustard',      hex:'#D4A017'},
  {id:'burnt-orange', name:'Burnt Org',    hex:'#CC5500'},
  {id:'lemon',        name:'Lemon',        hex:'#FFF44F'},
  {id:'goldenrod',    name:'Goldenrod',    hex:'#DAA520'},
  // Greens
  {id:'emerald',      name:'Emerald',      hex:'#10B981'},
  {id:'mint',         name:'Mint',         hex:'#6EE7B7'},
  {id:'jade-ac',      name:'Jade',         hex:'#059669'},
  {id:'sage-ac',      name:'Sage',         hex:'#84CC16'},
  {id:'lime',         name:'Lime',         hex:'#A3E635'},
  {id:'teal',         name:'Teal',         hex:'#14B8A6'},
  {id:'seafoam',      name:'Seafoam',      hex:'#5EEAD4'},
  {id:'moss',         name:'Moss',         hex:'#4D7C0F'},
  {id:'forest-ac',    name:'Forest',       hex:'#166534'},
  {id:'olive',        name:'Olive',        hex:'#65A30D'},
  {id:'lime-green',   name:'Lime Grn',     hex:'#32CD32'},
  {id:'pine-green',   name:'Pine',         hex:'#01796F'},
  {id:'viridian',     name:'Viridian',     hex:'#40826D'},
  {id:'sage-green',   name:'Sage Grn',     hex:'#8FBC8F'},
  {id:'hunter',       name:'Hunter',       hex:'#355E3B'},
  // Warm Tones
  {id:'terracotta',   name:'Terracotta',   hex:'#CC4E2A'},
  {id:'brick',        name:'Brick',        hex:'#B5451B'},
  {id:'rust',         name:'Rust',         hex:'#B7410E'},
  {id:'bronze',       name:'Bronze',       hex:'#CD7F32'},
  {id:'hazel',        name:'Hazel',        hex:'#8E7455'},
  {id:'maple',        name:'Maple',        hex:'#D4723A'},
  {id:'cinnamon',     name:'Cinnamon',     hex:'#D2691E'},
  // Cool Tones
  {id:'slate-blue-ac',name:'Slate Blue',   hex:'#6A7FDB'},
  {id:'arctic-ac',    name:'Arctic',       hex:'#B2E0F0'},
  {id:'powder-blue',  name:'Powder Blue',  hex:'#B0D8E8'},
  {id:'muted-teal',   name:'Muted Teal',   hex:'#5F9EA0'},
  {id:'seafoam-deep', name:'Seafoam Dp',   hex:'#3CB371'},
  {id:'mint-fresh',   name:'Mint Fresh',   hex:'#98FF98'},
  {id:'glacier',      name:'Glacier',      hex:'#72A0C1'},
  // Neutrals & Metallics
  {id:'white',        name:'White',        hex:'#FFFFFF'},
  {id:'silver',       name:'Silver',       hex:'#CBD5E1'},
  {id:'platinum',     name:'Platinum',     hex:'#E2E8F0'},
  {id:'champagne',    name:'Champagne',    hex:'#FAF0E6'},
  {id:'sand',         name:'Sand',         hex:'#D4B896'},
  {id:'slate-ac',     name:'Slate',        hex:'#94A3B8'},
  {id:'warm-white',   name:'Warm White',   hex:'#FFF8F0'},
  {id:'oyster',       name:'Oyster',       hex:'#EDE0D4'},
  {id:'stone',        name:'Stone',        hex:'#C2B280'},
  {id:'pewter',       name:'Pewter',       hex:'#96A0A8'},
  {id:'graphite-ac',  name:'Graphite',     hex:'#707880'},
  // Metallics
  {id:'gold-foil',    name:'Gold Foil',    hex:'#FFD700'},
  {id:'rose-gold-ac', name:'Rose Gold',    hex:'#E8A09A'},
  {id:'neon-cyan',    name:'Neon Cyan',    hex:'#00FFFF'},
];

// ─── Legacy CARD_THEMES (kept for backward compat) ──────────────────────────
const CARD_THEMES = CARD_BG_STYLES.map(s => {
  const isDark = s.dark;
  return {
    id: s.id, name: s.name, bg: s.bg,
    accent: '#CBA43A',
    text: isDark ? '#fff' : '#1e293b',
    textSoft: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(30,41,59,0.58)',
    border: isDark ? 'rgba(232,184,75,0.25)' : 'rgba(205,154,22,0.20)',
    pattern: 'lightning',
    color: isDark ? '#CBA43A' : '#A8841F'
  };
});

const CARD_PATTERNS={
  none:``,
  lines:`<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="0.75">${Array.from({length:76},(_,i)=>{const o=i*8-220;return `<line x1="${o}" y1="0" x2="${o+310}" y2="250"/>`;}).join('')}</g></svg>`,
  mesh:`<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="0.5">${Array.from({length:76},(_,i)=>{const o=i*8-220;return `<line x1="${o}" y1="0" x2="${o+310}" y2="250"/>`;}).join('')}${Array.from({length:76},(_,i)=>{const o=i*8-220;return `<line x1="${400-o}" y1="0" x2="${90-o}" y2="250"/>`;}).join('')}</g></svg>`,
  halftone:`<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g fill="currentColor">${Array.from({length:352},(_,i)=>{const col=i%22,row=Math.floor(i/22),x=col*19+(row%2?9.5:0)+4,y=row*14+7;return `<circle cx="${x}" cy="${y}" r="2.2"/>`;}).join('')}</g></svg>`,
  hexgrid:`<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="1.1" fill="none">${(()=>{const R=22,rows=9,cols=13,out=[];for(let r=0;r<rows;r++){for(let c=0;c<cols;c++){const cx=c*R*1.732+(r%2?R*0.866:0),cy=r*R*1.5+R;out.push(`<polygon points="${[0,1,2,3,4,5].map(k=>{const a=(k*60+30)*Math.PI/180;return `${(cx+R*Math.cos(a)).toFixed(1)},${(cy+R*Math.sin(a)).toFixed(1)}`;}).join(' ')}"/>`);}}return out.join('');})()}</g></svg>`,
  topo:`<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" stroke-width="1.1"><path d="M-20,28 C52,6 118,54 198,26 C278,2 348,48 430,20"/><path d="M-20,56 C48,33 115,82 195,54 C275,26 345,74 430,48"/><path d="M-20,86 C58,62 122,112 202,82 C282,54 352,102 430,77"/><path d="M-20,116 C55,90 128,140 208,110 C288,80 355,130 430,106"/><path d="M-20,146 C62,120 130,170 210,140 C290,110 358,160 430,135"/><path d="M-20,176 C66,150 135,200 215,170 C295,140 362,188 430,164"/><path d="M-20,206 C60,180 132,228 212,198 C292,168 360,216 430,192"/><path d="M-20,236 C58,210 130,256 210,228 C290,198 358,244 430,220"/></g></svg>`,
  constellation:`<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${(()=>{const p=[{x:25,y:28},{x:88,y:15},{x:154,y:44},{x:210,y:20},{x:272,y:38},{x:332,y:14},{x:386,y:52},{x:50,y:92},{x:118,y:116},{x:182,y:80},{x:244,y:106},{x:305,y:72},{x:368,y:98},{x:28,y:162},{x:84,y:188},{x:148,y:153},{x:216,y:180},{x:276,y:146},{x:344,y:172},{x:396,y:145},{x:60,y:226},{x:128,y:238},{x:198,y:216},{x:268,y:233},{x:338,y:218}],e=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[0,7],[1,8],[2,9],[3,9],[4,10],[5,11],[6,12],[7,8],[8,9],[9,10],[10,11],[11,12],[7,13],[8,14],[9,15],[10,16],[11,17],[12,18],[13,14],[14,15],[15,16],[16,17],[17,18],[13,20],[14,21],[15,22],[16,22],[17,23],[18,24],[20,21],[21,22],[22,23],[23,24]];return `<g stroke="currentColor" stroke-width="0.6" opacity="0.5">${e.map(([a,b])=>`<line x1="${p[a].x}" y1="${p[a].y}" x2="${p[b].x}" y2="${p[b].y}"/>`).join('')}</g><g fill="currentColor">${p.map((pt,i)=>`<circle cx="${pt.x}" cy="${pt.y}" r="${1.6+Math.sin(i*1.7)*0.6}"/>`).join('')}</g>`;})()}</svg>`,
  blueprint:`<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" fill="none">${Array.from({length:21},(_,i)=>`<line x1="${i*20}" y1="0" x2="${i*20}" y2="250" stroke-width="${i%5===0?1.1:0.28}"/>`).join('')}${Array.from({length:13},(_,i)=>`<line x1="0" y1="${i*20}" x2="400" y2="${i*20}" stroke-width="${i%5===0?1.1:0.28}"/>`).join('')}</g></svg>`,
  waves:`<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" stroke-width="1.3">${Array.from({length:16},(_,i)=>{const y=i*18-12;return `<path d="M-30,${y} C70,${y-19} 170,${y+19} 270,${y} C370,${y-19} 430,${y+19} 500,${y}"/>`;}).join('')}</g></svg>`,
  marble:`<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" stroke-linecap="round"><path d="M-15,42 C56,16 112,90 196,46 C280,6 326,84 430,36" stroke-width="2.8"/><path d="M-15,42 C56,16 112,90 196,46 C280,6 326,84 430,36" stroke-width="0.7" opacity="0.38" transform="translate(3,5)"/><path d="M-15,148 C64,118 126,190 212,150 C298,110 346,178 430,140" stroke-width="2.3"/><path d="M-15,148 C64,118 126,190 212,150 C298,110 346,178 430,140" stroke-width="0.6" opacity="0.32" transform="translate(-2,5)"/><path d="M62,-15 C96,52 46,118 132,170 C218,222 228,106 298,180 C368,254 352,136 430,190" stroke-width="1.9"/><path d="M272,-15 C300,40 336,90 358,152 C380,214 370,112 430,166" stroke-width="1.5" opacity="0.72"/><path d="M-15,215 C78,192 148,240 228,212 C308,184 372,228 430,208" stroke-width="1.4" opacity="0.6"/></g></svg>`,
  sparkle:`<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g fill="currentColor">${(()=>{const s=[[26,22,3.4],[86,14,2.7],[156,40,4],[212,18,3.1],[274,34,4.4],[336,12,3],[388,50,2.4],[16,78,2.1],[70,104,3.7],[136,70,2.7],[196,90,4.1],[256,74,2.9],[326,94,2.4],[374,120,3.4],[44,140,3.9],[110,160,2.7],[172,134,3.4],[238,154,4.4],[306,140,2.7],[360,164,3.1],[390,140,2],[16,197,2.9],[76,214,3.9],[146,190,3.1],[216,210,2.7],[280,196,3.9],[346,218,3.4],[393,202,2.4]];return s.map(([x,y,r])=>`<path d="M${x},${y-r*2.1} L${x+r*0.44},${y-r*0.44} L${x+r*2.1},${y} L${x+r*0.44},${y+r*0.44} L${x},${y+r*2.1} L${x-r*0.44},${y+r*0.44} L${x-r*2.1},${y} L${x-r*0.44},${y-r*0.44}Z"/>`).join('');})()}</g></svg>`,
  circuits:`<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="1.2" stroke-linecap="round" fill="currentColor"><line x1="0" y1="40" x2="76" y2="40"/><line x1="76" y1="40" x2="76" y2="16"/><line x1="76" y1="16" x2="156" y2="16"/><circle cx="76" cy="40" r="3.5" fill="none" stroke-width="1.7"/><circle cx="156" cy="16" r="3.5"/><line x1="156" y1="16" x2="216" y2="16"/><line x1="216" y1="16" x2="216" y2="76"/><line x1="216" y1="76" x2="306" y2="76"/><circle cx="216" cy="76" r="3.5" fill="none" stroke-width="1.7"/><line x1="306" y1="76" x2="306" y2="36"/><line x1="306" y1="36" x2="400" y2="36"/><circle cx="306" cy="36" r="3.5"/><line x1="0" y1="130" x2="46" y2="130"/><line x1="46" y1="130" x2="46" y2="96"/><circle cx="46" cy="96" r="3.5" fill="none" stroke-width="1.7"/><line x1="46" y1="96" x2="126" y2="96"/><line x1="126" y1="96" x2="126" y2="156"/><line x1="126" y1="156" x2="196" y2="156"/><circle cx="126" cy="156" r="3.5"/><line x1="196" y1="156" x2="196" y2="116"/><line x1="196" y1="116" x2="276" y2="116"/><circle cx="196" cy="116" r="3.5" fill="none" stroke-width="1.7"/><line x1="276" y1="116" x2="276" y2="166"/><line x1="276" y1="166" x2="366" y2="166"/><circle cx="276" cy="166" r="3.5"/><line x1="366" y1="166" x2="366" y2="126"/><line x1="366" y1="126" x2="400" y2="126"/><line x1="0" y1="216" x2="56" y2="216"/><line x1="56" y1="216" x2="56" y2="190"/><circle cx="56" cy="190" r="3.5" fill="none" stroke-width="1.7"/><line x1="56" y1="190" x2="146" y2="190"/><line x1="146" y1="190" x2="146" y2="230"/><line x1="146" y1="230" x2="236" y2="230"/><circle cx="146" cy="230" r="3.5"/><line x1="236" y1="230" x2="236" y2="196"/><line x1="236" y1="196" x2="316" y2="196"/><circle cx="236" cy="196" r="3.5" fill="none" stroke-width="1.7"/><line x1="316" y1="196" x2="316" y2="238"/><line x1="316" y1="238" x2="400" y2="238"/></g></svg>`,
  plus:`<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="1.5" stroke-linecap="round">${Array.from({length:176},(_,i)=>{const col=i%16,row=Math.floor(i/16),x=col*26+13,y=row*26+13;return `<line x1="${x-7}" y1="${y}" x2="${x+7}" y2="${y}"/><line x1="${x}" y1="${y-7}" x2="${x}" y2="${y+7}"/>`;}).join('')}</g></svg>`,
  rings:`<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="1" fill="none">${Array.from({length:13},(_,i)=>`<ellipse cx="200" cy="125" rx="${(i+1)*30}" ry="${(i+1)*19}"/>`).join('')}</g></svg>`,
  sunburst:`<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="0.9" fill="none">${Array.from({length:44},(_,i)=>{const a=(i/44)*Math.PI*0.92-Math.PI*0.02;return `<line x1="0" y1="250" x2="${(Math.cos(a)*620).toFixed(1)}" y2="${(250+Math.sin(a)*620).toFixed(1)}"/>`;}).join('')}</g></svg>`,
  linen:`<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" fill="none">${Array.from({length:51},(_,i)=>`<line x1="${i*8}" y1="0" x2="${i*8}" y2="250" stroke-width="${i%2===0?0.9:0.32}"/>`).join('')}${Array.from({length:32},(_,i)=>`<line x1="0" y1="${i*8}" x2="400" y2="${i*8}" stroke-width="${i%2===0?0.32:0.9}"/>`).join('')}</g></svg>`,
  dots:`<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g fill="currentColor">${Array.from({length:260},(_,i)=>{const col=i%20,row=Math.floor(i/20),x=col*21+10,y=row*21+10;return `<circle cx="${x}" cy="${y}" r="1.6"/>`;}).join('')}</g></svg>`,
  diagonal:`<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="0.75">${Array.from({length:76},(_,i)=>{const o=i*8-220;return `<line x1="${400-o}" y1="0" x2="${90-o}" y2="250"/>`;}).join('')}</g></svg>`,
  zigzag:`<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="1.2" fill="none">${Array.from({length:14},(_,i)=>{const y=i*20;const pts=Array.from({length:28},(_,j)=>`${j*16},${y+(j%2===0?0:10)}`).join(' ');return `<polyline points="${pts}"/>`;}).join('')}</g></svg>`,
  grid:`<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="0.5" fill="none">${Array.from({length:21},(_,i)=>`<line x1="${i*20}" y1="0" x2="${i*20}" y2="250"/>`).join('')}${Array.from({length:13},(_,i)=>`<line x1="0" y1="${i*21}" x2="400" y2="${i*21}"/>`).join('')}</g></svg>`,
  triangles:`<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="0.8" fill="none">${(()=>{const W=32,H=28,out=[];for(let r=0;r<12;r++){for(let c=0;c<16;c++){const x=c*W+(r%2?W/2:0),y=r*H;out.push(`<polygon points="${x},${y+H} ${x+W/2},${y} ${x+W},${y+H}"/>`);}}return out.join('');})()}</g></svg>`,
  dashes:`<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="1.1" stroke-linecap="round">${Array.from({length:200},(_,i)=>{const col=i%20,row=Math.floor(i/20),x=col*22+(row%2?11:0),y=row*14+7;return `<line x1="${x}" y1="${y}" x2="${x+10}" y2="${y}"/>`;}).join('')}</g></svg>`,
  petals:`<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="0.9" fill="none">${(()=>{const out=[];for(let r=0;r<8;r++){for(let c=0;c<14;c++){const x=c*30+(r%2?15:0),y=r*32;out.push(`<ellipse cx="${x}" cy="${y}" rx="8" ry="14" transform="rotate(0 ${x} ${y})"/>`);out.push(`<ellipse cx="${x}" cy="${y}" rx="8" ry="14" transform="rotate(60 ${x} ${y})"/>`);out.push(`<ellipse cx="${x}" cy="${y}" rx="8" ry="14" transform="rotate(120 ${x} ${y})"/>`);}}return out.join('');})()}</g></svg>`,
  cobweb:`<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="0.7" fill="none">${Array.from({length:12},(_,i)=>{const a=i*(Math.PI*2/12),x2=(200+Math.cos(a)*280).toFixed(1),y2=(125+Math.sin(a)*200).toFixed(1);return `<line x1="200" y1="125" x2="${x2}" y2="${y2}"/>`;}).join('')}${[40,80,120,160].map(r=>`<ellipse cx="200" cy="125" rx="${r*1.4}" ry="${r}"/>`).join('')}</g></svg>`,
};

const LONDON_AREAS=['Shoreditch','Dalston','Hackney','Peckham','Brixton','Clapham','Soho','Fitzrovia','Islington','Bethnal Green','Bermondsey','Borough','Vauxhall','Battersea','Chelsea','Fulham','Hammersmith','Notting Hill','Kensington','Camden','Kentish Town','Holloway','Crouch End','Stoke Newington','Wood Green','Tottenham','Stratford','Bow','Canary Wharf','Greenwich','Lewisham','New Cross','Crystal Palace','Dulwich','Herne Hill','Tooting','Wimbledon','Richmond','Kingston','Putney','Wandsworth','Balham','Elephant & Castle','Southwark','Wapping','Mayfair','Marylebone','King\'s Cross','Angel','Farringdon','Barbican','Clerkenwell','Whitechapel','Bethnal Green','Stepney','Mile End','Walthamstow','Leyton'];
const CATEGORY_KEYWORDS={"Gaming":["gaming","video game","games","esports","arcade","retro"],"Creative":["art","painting","drawing","sketch","pottery","crafts","ceramics"],"Movie Nights":["movies","film","cinema","screening"],"Board Games":["board games","tabletop","strategy","puzzles","catan"],"Meetups":["meetups","social","networking","making friends"],"Food & Drink":["food","drink","wine","cocktails","beer","cooking","tasting"],"Live Music":["live music","gig","concert","open mic","jazz","acoustic"],"Wellness & Outdoors":["wellness","yoga","meditation","outdoors","fitness","running","mindfulness"],"Tech & Talks":["tech","startup","coding","ai","talks","hackathon","product"]};
const MILESTONE_BADGES=[{id:'m1',name:'First Step',glyph:'I',need:1,desc:'RSVP to your first event',metal:'#C97B4A',tier:'Bronze'},{id:'m3',name:'Getting Around',glyph:'III',need:3,desc:'RSVP to 3 events',metal:'#B7C2CC',tier:'Silver'},{id:'m5',name:'Local Regular',glyph:'V',need:5,desc:'RSVP to 5 events',metal:'#F4C430',tier:'Gold'},{id:'m10',name:'Cloud Chaser',glyph:'X',need:10,desc:'RSVP to 10 events',metal:'#9FE3F0',tier:'Platinum'}];
const CATEGORY_BADGES=[{id:'cat-Creative',name:'Creative Soul',cat:'Creative',glyph:'✎',desc:'Attend a creative event'},{id:'cat-Gaming',name:'Player One',cat:'Gaming',glyph:'◉',desc:'Attend a gaming event'},{id:'cat-Movie Nights',name:'Cinephile',cat:'Movie Nights',glyph:'▷',desc:'Attend a movie night'},{id:'cat-Board Games',name:'Tactician',cat:'Board Games',glyph:'♟',desc:'Attend a board game night'},{id:'cat-Meetups',name:'Social Butterfly',cat:'Meetups',glyph:'❋',desc:'Attend a meetup'},{id:'cat-Food & Drink',name:'Taste Maker',cat:'Food & Drink',glyph:'❖',desc:'Attend a food & drink event'},{id:'cat-Live Music',name:'Music Lover',cat:'Live Music',glyph:'♪',desc:'Attend a live music event'},{id:'cat-Wellness & Outdoors',name:'Grounded',cat:'Wellness & Outdoors',glyph:'❀',desc:'Attend a wellness or outdoors event'},{id:'cat-Tech & Talks',name:'Builder',cat:'Tech & Talks',glyph:'⚙',desc:'Attend a tech & talks event'}];
const ALLROUNDER_BADGE={id:'allrounder',name:'All-Rounder',glyph:'✺',desc:'Attend one of every category',metal:'linear-gradient(135deg,#F4C430 0%, #9FE3F0 55%, #8C7FB0 100%)',glow:'#F4C430',tier:'Legendary'};
const TOTAL_CATEGORIES=Object.keys(CATS).length;
const SPECIAL_BADGES=[{id:'sp-launch',name:'Launch Night',glyph:'★',code:'LAUNCH',desc:'Here from the very start'},{id:'sp-summer',name:'Summer Sessions',glyph:'★',code:'SUMMER26',desc:'Special community event'}];

const LEVELS=[
  {min:0,  title:'Newcomer',         color:'#8B95A8', glow:'rgba(139,149,168,0.25)', ring:'1px solid #8B95A8'},
  {min:1,  title:'Explorer',         color:'#CD7F32', glow:'rgba(205,127,50,0.35)',  ring:'1.5px solid #CD7F32'},
  {min:3,  title:'Regular',          color:'#C0C0C0', glow:'rgba(192,192,192,0.35)', ring:'1.5px solid #C0C0C0'},
  {min:6,  title:'Enthusiast',       color:'#FFD700', glow:'rgba(255,215,0,0.4)',    ring:'2px solid #FFD700'},
  {min:10, title:'Community Pillar', color:'#9FE3F0', glow:'rgba(159,227,240,0.45)', ring:'2px solid #9FE3F0'},
  {min:15, title:'Legend',           color:'#FBBF24', glow:'rgba(251,191,36,0.55)',  ring:'2.5px solid #FBBF24'},
];
function getLevel(n){
  let lv=LEVELS[0];
  for(const l of LEVELS){ if(n>=l.min) lv=l; else break; }
  return lv;
}

const INTEREST_PRESETS=['Live Music','Food & Drink','Board Games','Gaming','Film & Cinema','Wellness','Outdoors','Tech','Art & Creative','Comedy','Networking','Sports','Dance','Cocktails','Coffee','Photography','Books','Theatre'];


const nowObj=new Date();
const CALENDAR_YEAR=nowObj.getFullYear();
const CALENDAR_MONTH=nowObj.getMonth();
const MONTH_NAMES=["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAY_LABELS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const BLOT_SVG=`<svg class="blot-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill="var(--gold)" d="M10 1c2 1 4 2 5 4.5 1 2.3 1 4.6-0.3 6.6-1.3 2-3.6 3.3-5.7 4.8-1-1.3-2.7-2-4.2-3.2C2.8 12 1.3 9.8 1.8 7.3 2.3 4.7 4.7 3 7 1.8 8 1.3 9 0.7 10 1Z"/></svg>`;
const EMAIL_PATTERN=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let state={view:'browse',selectedEventId:null,selectedCategory:'all',calendarDay:null,
  userId:null,
  profileName:'',profileEmail:'',profileId:null,specialBadges:[],theme:'light',
  editingProfile:false,myCard:null,rsvps:{},attendeeCards:{},chats:{},friends:[],friendsOnly:false,goingOpen:{},liveOnly:false,hotOnly:false,
  curatorVerified:false,curatorCode:null,curatorTier:null,checkedInEventId:null};
let cardDraft={theme:'obsidian',bgStyle:'obsidian',accentColor:'#CBA43A',pattern:'constellation',patternOpacity:0.35,bio:'',interests:'',fact:'',motto:'',photo:'',areas:[]};
let cardEditorEventId=null;
let lmap=null,lmapFitted=false;
let hostMap=null,hostMarker=null;
let newEventLat=51.5072,newEventLon=-0.1276;

// ── Storage helpers ──────────────────────────────────────────────────────
// localStorage kept only for geocode cache (perf optimisation, not user data)
async function localGet(key){ try{ return localStorage.getItem(key); }catch(e){ return null; } }
async function localSet(key,value){ try{ localStorage.setItem(key,value); }catch(e){} }
// Legacy aliases so any remaining calls still work during transition
async function storageGet(key){ return localGet(key); }
async function storageSet(key,value){ return localSet(key,value); }

function initials(name){ if(!name||!name.trim()) return '?'; const p=name.trim().split(/\s+/); return (p[0][0]+(p.length>1?p[1][0]:'')).toUpperCase(); }
function hexToRgba(hex,a){ const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; }
function escapeHtml(s){ return (s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function showToast(msg, type='info'){
  let wrap=document.getElementById('cu-toast-wrap');
  if(!wrap){ wrap=document.createElement('div'); wrap.id='cu-toast-wrap'; wrap.className='cu-toast-wrap'; document.body.appendChild(wrap); }
  const t=document.createElement('div');
  t.className='cu-toast'+(type==='error'?' error':type==='success'?' success':'');
  t.textContent=msg;
  wrap.appendChild(t);
  setTimeout(()=>{ t.classList.add('hiding'); t.addEventListener('animationend',()=>t.remove(),{once:true}); },3200);
}
function showConfirm(title, body, confirmLabel, dangerFnName){
  const ov=document.createElement('div');
  ov.className='cu-confirm-overlay';
  ov.setAttribute('id','cu-confirm-overlay');
  ov.innerHTML=`<div class="cu-confirm-sheet" role="dialog" aria-modal="true"><div class="cu-confirm-title">${escapeHtml(title)}</div><div class="cu-confirm-body">${escapeHtml(body)}</div><div class="cu-confirm-actions"><button class="btn btn-cancel" onclick="document.getElementById('cu-confirm-overlay')?.remove()">Cancel</button><button class="btn" onclick="document.getElementById('cu-confirm-overlay')?.remove();window['${dangerFnName}'](true)">${escapeHtml(confirmLabel)}</button></div></div>`;
  document.body.appendChild(ov);
}
function getTheme(id){ return CARD_THEMES.find(t=>t.id===id)||CARD_THEMES[0]; }
function getBgStyle(id){ return CARD_BG_STYLES.find(s=>s.id===id)||CARD_BG_STYLES[0]; }
function resolveCardColors(bgStyleId, accentHex){
  const style = getBgStyle(bgStyleId);
  const acc = accentHex || '#CBA43A';
  const isDark = style.dark;
  return {
    bg: style.bg,
    accent: acc,
    text: isDark ? '#fff' : '#1e293b',
    textSoft: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(30,41,59,0.58)',
    border: `${acc}40`,
    dark: isDark
  };
}
function applyTheme(){ document.documentElement.setAttribute('data-theme',state.theme); }

// Follow OS theme changes in real-time — only when the user hasn't pinned a preference
try {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    try {
      const p = JSON.parse(localStorage.getItem('prefs')||'{}');
      if(p.theme) return; // user chose manually — don't override
      state.theme = e.matches ? 'dark' : 'light';
      applyTheme();
      const tcMeta = document.querySelector('meta[name="theme-color"]:not([media])');
      if(tcMeta) tcMeta.setAttribute('content', state.theme==='dark'?'#090A0C':'#3E7CB8');
      try{ renderNav(); }catch(err){}
    } catch(err) {}
  });
} catch(e) {}


// ---- MAPBOX TOKEN ----
const DEFAULT_MAPBOX_TOKEN=(window.CUMULUS_CONFIG&&window.CUMULUS_CONFIG.MAPBOX_TOKEN)||'pk.eyJ1IjoibHVjcmFzc3Nzc3MiLCJhIjoiY21xam1pcTJ4MGt0dTJzcXhobnQyZ3owMiJ9.RpRNYuS-zJnNdZ3wOGl61g';
let MAPBOX_TOKEN=DEFAULT_MAPBOX_TOKEN;
function mapboxConfigured(){ return !!(MAPBOX_TOKEN&&MAPBOX_TOKEN.trim()); }
// Switched to Mapbox Standard Style to seamlessly support toggle properties without map reload.
function mapboxStyleUrl(){ return 'mapbox://styles/mapbox/standard'; }

// ---- GEOCODING ----
let geocodeCache={},geocodingInProgress=false,geocodeProgress={done:0,total:0};
async function loadGeocodeCache(){ try{ const r=await storageGet('geocode_cache'); geocodeCache=r?JSON.parse(r):{}; }catch(e){ geocodeCache={}; } }
async function persistGeocodeCache(){
  try{
    const keys=Object.keys(geocodeCache);
    if(keys.length>300){ keys.slice(0,keys.length-300).forEach(k=>delete geocodeCache[k]); }
    await storageSet('geocode_cache',JSON.stringify(geocodeCache));
  }catch(e){}
}
function needsGeocode(ev){ return (ev.lat==null||ev.lon==null)&&ev.address; }
async function geocodeAddress(address){
  if(geocodeCache[address]) return geocodeCache[address];
  const url=`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&country=gb&limit=1&proximity=-0.1276,51.5072`;
  const res=await fetch(url);
  if(!res.ok) throw new Error(`geocode ${res.status}`);
  const data=await res.json();
  const f=data.features&&data.features[0];
  if(!f) throw new Error(`no match: ${address}`);
  const coords={lat:f.center[1],lon:f.center[0]};
  geocodeCache[address]=coords;
  return coords;
}
function geocodeBannerHtml(){
  if(!geocodingInProgress) return '';
  return `<div class="map-caption" style="bottom:auto;top:calc(var(--top-h) + 10px);right:12px;left:auto;transform:none;font-size:10.5px;">${geocodeProgress.done}/${geocodeProgress.total} placed</div>`;
}
function updateGeocodeBanner(){ const el=document.getElementById('geocode-banner'); if(el) el.innerHTML=geocodeBannerHtml(); }
const AREA_FALLBACK_CENTER={lat:51.5072,lon:-0.1276};
async function resolveEventLocations(){
  if(geocodingInProgress||!mapboxConfigured()) return;
  const pending=EVENTS.filter(needsGeocode);
  if(!pending.length) return;
  geocodingInProgress=true; geocodeProgress={done:0,total:pending.length};
  updateGeocodeBanner();
  const concurrency=6; let idx=0;
  async function worker(){
    while(idx<pending.length){
      const ev=pending[idx++];
      try{ const c=await geocodeAddress(ev.address); ev.lat=c.lat; ev.lon=c.lon; }
      catch(e){ const f=AREA_FALLBACK_CENTER; ev.lat=f.lat+(Math.random()-0.5)*0.06; ev.lon=f.lon+(Math.random()-0.5)*0.10; }
      geocodeProgress.done++;
      updateGeocodeBanner();
      if(state.view==='browse') refreshMarkers();
    }
  }
  await Promise.all(Array.from({length:concurrency},worker));
  await persistGeocodeCache();
  geocodingInProgress=false; updateGeocodeBanner();
}

function attendeesFor(id){ const out=DEMO_PEOPLE.filter(p=>p.events.includes(id)).map(p=>p.name); (state.rsvps[id]||[]).forEach(n=>{ if(!out.includes(n)) out.push(n); }); return out; }
function isFriend(name){ return state.friends.includes(name); }
function myFriendCode(){ return codeFor(state.profileName||'ME',state.profileId||'000000'); }

async function toggleTheme(){
  state.theme=state.theme==='light'?'dark':'light';
  applyTheme();
  // Persist locally so the choice survives sessions / logged-out use
  try{ const p=JSON.parse(localStorage.getItem('prefs')||'{}'); p.theme=state.theme; localStorage.setItem('prefs',JSON.stringify(p)); }catch(e){}
  // Update browser chrome colour
  const tcMeta=document.querySelector('meta[name="theme-color"]:not([media])');
  if(tcMeta) tcMeta.setAttribute('content', state.theme==='dark'?'#090A0C':'#3E7CB8');
  if(state.userId){
    await sb.from('users').update({theme:state.theme}).eq('id',state.userId);
  }
  renderNav();
  if(lmap && lmap.isStyleLoaded()) {
    lmap.setConfigProperty('basemap', 'lightPreset', state.theme === 'dark' ? 'night' : 'day');
    updateClusterPaint();
  }
  if(hostMap && hostMap.isStyleLoaded()) {
    hostMap.setConfigProperty('basemap', 'lightPreset', state.theme === 'dark' ? 'night' : 'day');
  }
}
async function persistProfile(){
  if(!state.profileId) state.profileId=generateUniqueId();
  const payload={
    name: state.profileName,
    email: state.profileEmail,
    profile_id: state.profileId,
    special_badges: state.specialBadges,
    theme: state.theme,
    card_theme: state.myCard?.theme||'crimson',
    card_bio: state.myCard?.bio||'',
    card_interests: state.myCard?.interests||'',
    card_fact: state.myCard?.fact||''
  };
  if(state.userId) payload.id=state.userId;
  const {data,error}=await sb.from('users').upsert(payload,{onConflict:'email'}).select().single();
  if(data&&data.id) state.userId=data.id;
}
function computeEventDates(ev){
  const st=new Date(ev.startTime),et=new Date(ev.endTime);
  ev.startsAt=st.getTime(); ev.endsAt=et.getTime();
  const df=new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short'});
  const tf=new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',hour12:true});
  ev.date=df.format(st); ev.time=`${tf.format(st)} - ${tf.format(et)}`;
}

async function start(){
  // Theme: saved pref wins; if none, fall back to OS preference
  const _sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const prefsRaw=await localGet('prefs');
  if(prefsRaw){ try{ const p=JSON.parse(prefsRaw); if(p.theme) state.theme=p.theme; else state.theme=_sysDark?'dark':'light'; }catch(e){ state.theme=_sysDark?'dark':'light'; } }
  else { state.theme=_sysDark?'dark':'light'; }
  applyTheme();
  MAPBOX_TOKEN=DEFAULT_MAPBOX_TOKEN;

  // Check if we have a cached email to try loading from Supabase. Any failure
  // here (network blip, Supabase unreachable) must never blank the app — fall
  // through to the cached-session restore, then to the gate.
  const cachedEmail=await localGet('cumulus_email');
  if(cachedEmail){
    let profile=null;
    try{ const r=await sb.from('users').select('*').eq('email',cachedEmail).single(); profile=r.data; }
    catch(e){ profile=null; }
    if(profile&&profile.name){
      state.userId=profile.id;
      state.profileId=profile.profile_id||generateUniqueId();
      state.profileName=profile.name;
      state.profileEmail=profile.email;
      state.specialBadges=profile.special_badges||[];
      // Supabase-saved theme wins; if they never set one, respect OS pref
      state.theme=profile.theme||(prefsRaw&&JSON.parse(prefsRaw||'{}').theme)||(_sysDark?'dark':'light');
      applyTheme();
      // Restore card from profile columns
      if(profile.card_bio||profile.card_theme){
        state.myCard={
          name:profile.name,
          theme:profile.card_theme||'crimson',
          bio:profile.card_bio||'',
          interests:profile.card_interests||'',
          fact:profile.card_fact||''
        };
      }
      _cacheSession();
      enterApp();
      return;
    }
    // Supabase didn't answer but we have a cached snapshot — restore offline.
    // Fresh data loads in the background once initApp() reaches the network.
    try{
      const raw=await localGet('cumulus_session');
      if(raw){
        const s=JSON.parse(raw);
        if(s&&s.email===cachedEmail&&s.name){
          state.userId=s.userId;
          state.profileId=s.profileId||generateUniqueId();
          state.profileName=s.name;
          state.profileEmail=s.email;
          state.specialBadges=s.specialBadges||[];
          if(s.theme){ state.theme=s.theme; applyTheme(); }
          enterApp();
          return;
        }
      }
    }catch(e){}
  }
  // No cached session — show the gate
  renderGate();
}

const FEATURED_EVENTS = [
  {
    id:'f1', title:'Drum & Bass Warehouse Session',
    category:'Live Music', categoryColor:'#CBA43A',
    venue:'Tobacco Dock', area:'Wapping, London E1W',
    date:'Sat 28 Jun', time:'10 PM – 4 AM',
    capacity:1200, attending:847,
    price:'From £18', badge:'SOLD OUT SOON',
    badgeColor:'#A8841F',
    desc:'Four rooms. Four sounds. One night that defines the summer.',
    icon:'🎶',
    gradient:'linear-gradient(135deg,#0A0A0A 0%,#1C1008 40%,#A8841F 100%)',
    accentColor:'#CBA43A'
  },
  {
    id:'f2', title:'Open-Air Cinema — Kensington Palace',
    category:'Movie Nights', categoryColor:'#CBA43A',
    venue:'Kensington Palace Gardens', area:'Kensington, London W8',
    date:'Fri 27 Jun', time:'8:30 PM',
    capacity:800, attending:612,
    price:'From £14', badge:'FEATURED',
    badgeColor:'#D9A52E',
    desc:'Blankets on the lawn, the palace lit behind you. Cinema reimagined.',
    icon:'🎬',
    gradient:'linear-gradient(135deg,#0A0A0A 0%,#1C1008 40%,#A8841F 100%)',
    accentColor:'#CBA43A'
  },
  {
    id:'f3', title:'London Startup Pitch Finals',
    category:'Tech & Talks', categoryColor:'#CBA43A',
    venue:'The Barbican Centre', area:'Barbican, London EC2Y',
    date:'Thu 26 Jun', time:'6 PM – 10 PM',
    capacity:500, attending:389,
    price:'Free', badge:'HIGH DEMAND',
    badgeColor:'#A8841F',
    desc:'Ten founders. Five minutes each. One city watching.',
    icon:'⚡',
    gradient:'linear-gradient(135deg,#0A0A0A 0%,#1C1008 40%,#A8841F 100%)',
    accentColor:'#CBA43A'
  },
  {
    id:'f4', title:'Smash Bros Championship — London',
    category:'Gaming', categoryColor:'#CBA43A',
    venue:'Copper Box Arena', area:'Olympic Park, London E20',
    date:'Sun 29 Jun', time:'12 PM – 8 PM',
    capacity:1500, attending:1201,
    price:'From £10', badge:'MAJOR EVENT',
    badgeColor:'#A8841F',
    desc:'The biggest bracket London has ever seen. Bring your controller.',
    icon:'🎮',
    gradient:'linear-gradient(135deg,#0A0A0A 0%,#1C1008 40%,#A8841F 100%)',
    accentColor:'#CBA43A'
  },
  {
    id:'f5', title:'Grand Supper Club — Rooftop Edition',
    category:'Food & Drink', categoryColor:'#CBA43A',
    venue:'Sky Garden', area:'Monument, London EC3M',
    date:'Wed 25 Jun', time:'7 PM – 11 PM',
    capacity:200, attending:176,
    price:'From £65', badge:'FEW LEFT',
    badgeColor:'#A8841F',
    desc:'Eight courses. 155 metres up. London laid out below you.',
    icon:'🍽',
    gradient:'linear-gradient(135deg,#0A0A0A 0%,#1C1008 40%,#A8841F 100%)',
    accentColor:'#CBA43A'
  }
];

function renderGate(prefillName,prefillEmail){
  document.getElementById('gate-root').innerHTML=`
  <div class="lp-root">

    <!-- ── STICKY NAV ── -->
    <nav class="lp-nav">
      <div class="lp-nav-inner">
        <div class="lp-nav-logo">${BLOT_SVG}<span>Cumulus</span></div>
        <div class="lp-nav-links hide-mobile">
          <a href="#" onclick="document.getElementById('lp-features-anchor').scrollIntoView({behavior:'smooth'});return false;">Features</a>
          <a href="#" onclick="document.getElementById('lp-venues-anchor').scrollIntoView({behavior:'smooth'});return false;">For Venues</a>
        </div>
        <div class="lp-nav-auth">
          <button class="lp-nav-login" onclick="showLpLogin()">Log in</button>
          <button class="btn lp-nav-btn" onclick="showLpSignup()">Request Access</button>
        </div>
      </div>
    </nav>

    <!-- ── HERO ── -->
    <section class="lp-hero">
      <div class="lp-hero-sky" aria-hidden="true"></div>
      <div class="lp-cloud-layer" aria-hidden="true">
        <!-- Real cumulus photos drifting across the sky at staggered speeds/heights.
             Slow durations = calm, natural movement. Behind the skyline (z-order). -->
        <div class="lp-cld" style="top:6%; width:58vw;opacity:0.92;--dur:158s;--dly:-20s; --ar:2019/447; background-image:url('assets/clouds/cloud2.webp')"></div>
        <div class="lp-cld" style="top:19%;width:46vw;opacity:0.80;--dur:196s;--dly:-120s;--ar:1951/583; background-image:url('assets/clouds/cloud1.webp')"></div>
        <div class="lp-cld" style="top:11%;width:72vw;opacity:0.96;--dur:126s;--dly:-72s; --ar:2049/815; background-image:url('assets/clouds/cloud5.webp')"></div>
        <div class="lp-cld" style="top:33%;width:60vw;opacity:0.88;--dur:170s;--dly:-42s; --ar:2049/701; background-image:url('assets/clouds/cloud4.webp')"></div>
        <div class="lp-cld" style="top:45%;width:52vw;opacity:0.70;--dur:214s;--dly:-150s;--ar:2049/1152;background-image:url('assets/clouds/cloud3.webp')"></div>
        <div class="lp-cld" style="top:27%;width:80vw;opacity:0.90;--dur:138s;--dly:-98s; --ar:2019/447; background-image:url('assets/clouds/cloud2.webp')"></div>
        <div class="lp-cld" style="top:55%;width:68vw;opacity:0.82;--dur:182s;--dly:-14s; --ar:2049/815; background-image:url('assets/clouds/cloud5.webp')"></div>
      </div>
      <div class="lp-skyline" aria-hidden="true"></div>
      <div class="lp-hero-scrim" aria-hidden="true"></div>
      <div class="lp-hero-blobs">
        <div class="lp-blob lp-blob-a"></div>
        <div class="lp-blob lp-blob-b"></div>
        <div class="lp-blob lp-blob-c"></div>
      </div>
      <div class="lp-hero-content">
        <div class="lp-hero-kicker">
          <span class="lp-live-dot"></span>
          London · Invite-only social club
        </div>
        <h1 class="lp-hero-title">Find your people.<br><span class="lp-hero-gradient">Unlock the city.</span></h1>
        <p class="lp-hero-sub">Cumulus is London's members-only social club — a live map of the city's best-kept events. Every pin is visible; the perks behind them (guestlists, complimentary drinks, secret rooms) unlock with a curator code or a check-in at the door.</p>
        <div class="lp-hero-actions">
          <button class="btn lp-hero-btn-primary" onclick="showLpSignup()">Unlock the Map →</button>
          <button class="btn btn-outline lp-hero-btn-secondary" onclick="document.getElementById('lp-features-anchor').scrollIntoView({behavior:'smooth'})">How it works ↓</button>
        </div>
        <div class="lp-trust-strip">
          <span>Invite only</span>
          <span>Curator codes</span>
          <span>Secret guestlists</span>
          <span>Members' perks</span>
        </div>
      </div>
      <div class="lp-hero-scroll-hint" onclick="document.getElementById('lp-features-anchor').scrollIntoView({behavior:'smooth'})">
        <span>Scroll to explore</span>
        <div class="lp-scroll-arrow"></div>
      </div>
    </section>

    <!-- ── FEATURES ── -->
    <section class="lp-features" id="lp-features-anchor">
      <div style="text-align:center;margin-bottom:52px;">
        <div class="lp-section-kicker">Everything you need</div>
        <h2 class="lp-section-title">One pass. Your whole city.</h2>
      </div>
      <div class="lp-features-grid">
        <div class="lp-feat-card">
          <div class="lp-feat-photo" style="background-image:url('assets/img/discover.svg')"></div>
          <div class="lp-feat-card-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg></div>
          <div class="lp-feat-card-title">Discover locally</div>
          <div class="lp-feat-card-desc">Browse events happening in your neighbourhood — from jazz nights and gallery openings to supper clubs and community walks.</div>
        </div>
        <div class="lp-feat-card">
          <div class="lp-feat-photo" style="background-image:url('assets/img/pass.svg')"></div>
          <div class="lp-feat-card-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg></div>
          <div class="lp-feat-card-title">Your digital pass</div>
          <div class="lp-feat-card-desc">A personalised card you carry to every event. Share your QR code to connect instantly with people you meet in person.</div>
        </div>
        <div class="lp-feat-card">
          <div class="lp-feat-photo" style="background-image:url('assets/img/connect.svg')"></div>
          <div class="lp-feat-card-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg></div>
          <div class="lp-feat-card-title">Real connections</div>
          <div class="lp-feat-card-desc">See who's going before you arrive. Meet people who share your interests. Build friendships that last beyond the event.</div>
        </div>
      </div>
    </section>

    <!-- ── VENUE PITCH ── -->
    <section class="lp-venues-section" id="lp-venues-anchor">
      <div class="lp-venues-inner">
        <div class="lp-venues-text">
          <div class="lp-section-kicker" style="color:var(--gold);">For Venues &amp; Promoters</div>
          <h2 class="lp-section-title" style="color:#fff;">Your event.<br>Our audience.</h2>
          <p style="color:rgba(255,255,255,0.72);font-size:15px;line-height:1.75;max-width:480px;">List your venue on Cumulus and reach thousands of active Londoners who are already looking for their next night out. We handle discovery, ticketing, pre-event buzz, and real-time attendee connection — you focus on the event.</p>
          <div class="lp-venue-features">
            <div class="lp-venue-feat"><div class="lp-feat-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div><div><div class="lp-feat-title">Map-first discovery</div><div class="lp-feat-desc">Your venue pinned and filterable across London's live event map.</div></div></div>
            <div class="lp-venue-feat"><div class="lp-feat-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 12c0-1.1.9-2 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v4c1.1 0 2 .9 2 2s-.9 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2zm-6 3.5h-4v-2h4v2zm0-5h-4v-2h4v2z"/></svg></div><div><div class="lp-feat-title">Zero-fee ticketing</div><div class="lp-feat-desc">Hosts keep 100% of their price. Cumulus adds only a flat platform fee to the buyer — no percentage cuts, ever.</div></div></div>
            <div class="lp-venue-feat"><div class="lp-feat-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg></div><div><div class="lp-feat-title">Pre-event community</div><div class="lp-feat-desc">Attendees connect before they arrive — higher show rates, better energy.</div></div></div>
            <div class="lp-venue-feat"><div class="lp-feat-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg></div><div><div class="lp-feat-title">Featured placement</div><div class="lp-feat-desc">Major events get priority placement across the Cumulus platform.</div></div></div>
          </div>
          <button class="btn lp-venues-cta" onclick="showLpSignup()">Get started — it's free →</button>
        </div>
        <div class="lp-venues-stats">
          <div class="lp-vstat"><div class="lp-vstat-num">100+</div><div class="lp-vstat-label">Active events</div></div>
          <div class="lp-vstat"><div class="lp-vstat-num">9</div><div class="lp-vstat-label">Categories</div></div>
          <div class="lp-vstat"><div class="lp-vstat-num">32</div><div class="lp-vstat-label">London boroughs</div></div>
          <div class="lp-vstat"><div class="lp-vstat-num">∞</div><div class="lp-vstat-label">Connections made</div></div>
        </div>
      </div>
    </section>

    <!-- ── COMMUNITY PROOF ── -->
    <section style="padding:80px 24px;background:var(--bg);position:relative;overflow:hidden;">
      <div style="max-width:860px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:52px;align-items:center;">
        <div>
          <div class="lp-join-eyebrow">Your community pass</div>
          <h2 class="lp-join-headline">This isn't about events.<br>It's about <em>your people.</em></h2>
          <p class="lp-join-body">Cumulus was built on one belief — the best things happen when people who live near each other actually meet. Not online. In the same room, at the same table, under the same open sky.</p>
          <div class="lp-join-proof" style="margin-top:24px;">
            <div class="lp-proof-avs">
              <div class="lp-proof-av" style="background:#6366F1;">A</div>
              <div class="lp-proof-av" style="background:#10B981;">P</div>
              <div class="lp-proof-av" style="background:#F97316;">T</div>
              <div class="lp-proof-av" style="background:#EC4899;">M</div>
              <div class="lp-proof-av" style="background:#8B5CF6;">J</div>
            </div>
            <span class="lp-proof-text">Londoners already building their community on Cumulus</span>
          </div>
          <button class="btn lp-hero-btn-primary" style="margin-top:28px;" onclick="showLpSignup()">Join them →</button>
        </div>
        <div class="lp-community-stack">
          <div class="lp-comm-card lp-comm-c1">
            <div class="lp-comm-avatars">
              <div class="lp-comm-av" style="background:#6366F1;">AR</div>
              <div class="lp-comm-av" style="background:#10B981;">PS</div>
              <div class="lp-comm-av" style="background:#F97316;">TB</div>
            </div>
            <div class="lp-comm-text">
              <div class="lp-comm-title">Jazz in the Park</div>
              <div class="lp-comm-sub">Herne Hill · 40 going</div>
            </div>
            <div class="lp-comm-dot" style="background:#10B981;"></div>
          </div>
          <div class="lp-comm-card lp-comm-c2">
            <div class="lp-comm-avatars">
              <div class="lp-comm-av" style="background:#EC4899;">ML</div>
              <div class="lp-comm-av" style="background:#8B5CF6;">JC</div>
            </div>
            <div class="lp-comm-text">
              <div class="lp-comm-title">Ceramics &amp; Chill</div>
              <div class="lp-comm-sub">Bermondsey · 25 going</div>
            </div>
            <div class="lp-comm-dot" style="background:#8B5CF6;"></div>
          </div>
          <div class="lp-comm-card lp-comm-c3">
            <div class="lp-comm-avatars">
              <div class="lp-comm-av" style="background:#EF4444;">SO</div>
              <div class="lp-comm-av" style="background:#D9A52E;">OW</div>
              <div class="lp-comm-av" style="background:#3B82F6;">CD</div>
              <div class="lp-comm-av lp-comm-av-more">+12</div>
            </div>
            <div class="lp-comm-text">
              <div class="lp-comm-title">Supper Club — Fulham</div>
              <div class="lp-comm-sub">Fulham · 26 going</div>
            </div>
            <div class="lp-comm-dot" style="background:#EF4444;"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── FOOTER ── -->
    <footer class="lp-footer">
      <div class="lp-nav-logo" style="margin-bottom:10px;">${BLOT_SVG}<span style="font-size:16px;font-weight:800;color:var(--text-muted);">Cumulus</span></div>
      <p style="font-size:12px;color:var(--text-muted);margin:0 0 10px;">London Community Events · ${new Date().getFullYear()}</p>
      <div style="display:flex;gap:18px;justify-content:center;flex-wrap:wrap;">
        <a href="/privacy" style="font-size:11px;color:var(--text-muted);text-decoration:none;opacity:0.65;transition:opacity .15s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.65'">Privacy</a>
        <a href="/terms" style="font-size:11px;color:var(--text-muted);text-decoration:none;opacity:0.65;transition:opacity .15s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.65'">Terms</a>
        <a href="mailto:hello@cumulusapp.co" style="font-size:11px;color:var(--text-muted);text-decoration:none;opacity:0.65;transition:opacity .15s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.65'">Contact</a>
      </div>
    </footer>

    <!-- ── SIGN-UP MODAL ── -->
    <div class="lp-signup-overlay" id="lp-signup-overlay" onclick="if(event.target===this)closeLpSignup()">
      <div class="lp-signup-modal">
        <button class="lp-signup-close" onclick="closeLpSignup()" aria-label="Close">✕</button>

        <!-- Auth mode: Sign up vs Log in -->
        <div class="auth-mode-sel">
          <button class="auth-mode-btn active" id="am-signup" onclick="switchAuthMode('signup')">Request Access</button>
          <button class="auth-mode-btn" id="am-login" onclick="switchAuthMode('login')">Log in</button>
        </div>

        <!-- Type selector: Attendee vs Host (sign up only) -->
        <div class="gate-type-sel" id="gate-type-sel">
          <button class="gate-type-btn active" id="gt-attendee" onclick="switchSignupType('attendee')">
            Join as attendee
          </button>
          <button class="gate-type-btn" id="gt-host" onclick="switchSignupType('host')">
            Become a host
          </button>
        </div>

        <!-- Attendee pass preview -->
        <div id="gate-attendee-preview" class="lp-pass-preview" style="margin-bottom:20px;">
          <div class="lp-pass-card" id="lp-pass-preview-card" style="background:linear-gradient(140deg,var(--accent),var(--accent-deep));">
            <div class="lp-pass-shine"></div>
            <div class="lp-pass-label">// Cumulus Pass</div>
            <div class="lp-pass-name" id="lp-pass-name-preview">Your name here</div>
            <div class="lp-pass-detail">London Community Member</div>
            <div class="lp-pass-tags">
              <span class="lp-pass-tag">Live Music</span>
              <span class="lp-pass-tag">Food &amp; Drink</span>
              <span class="lp-pass-tag">Meetups</span>
            </div>
            <div class="lp-pass-watermark">CU</div>
          </div>
          <div class="lp-pass-caption">This is what you'll carry to every event.</div>
        </div>

        <!-- Host teaser (shown when host tab selected) -->
        <div id="gate-host-preview" style="display:none;margin-bottom:20px;padding:16px;background:color-mix(in srgb,var(--accent) 6%,transparent);border:1px solid color-mix(in srgb,var(--accent) 20%,transparent);border-radius:14px;">
          <div style="font-size:22px;margin-bottom:8px;">🎪</div>
          <div style="font-weight:800;font-size:14px;color:var(--text);margin-bottom:4px;">Host verified events on Cumulus</div>
          <div style="font-size:12px;color:var(--text-muted);line-height:1.6;">Tell us about your venue or events. Applications are reviewed by our team — approved hosts can post public events, sell tickets, and access host analytics.</div>
        </div>

        <div class="lp-form-eyebrow" id="gate-form-eyebrow">Invite only · Takes 20 seconds</div>
        <h3 class="lp-form-title" id="gate-form-title">Request your access</h3>
        <p class="lp-form-sub" id="gate-form-sub">Cumulus is members-only. Enter your curator code to unlock the map — or check in at any venue to earn one.</p>

        <div class="gate-field" id="gate-name-field">
          <label class="gate-label" for="gate-name">Full name</label>
          <input id="gate-name" class="gate-input" placeholder="e.g. Alex Rivera" value="${escapeHtml(prefillName||'')}" autocomplete="name" oninput="lpUpdatePassName(this.value)"/>
        </div>
        <div class="gate-field">
          <label class="gate-label" for="gate-email">Email address</label>
          <input id="gate-email" class="gate-input" type="email" placeholder="you@email.com" value="${escapeHtml(prefillEmail||'')}" autocomplete="email"/>
        </div>
        <div class="gate-field" id="gate-curator-field">
          <label class="gate-label" for="gate-curator">Curator code</label>
          <input id="gate-curator" class="gate-input gate-curator-input" placeholder="CUR-XXXX-XXXX" autocomplete="off" spellcheck="false" oninput="this.value=this.value.toUpperCase()"/>
          <p class="gate-fineprint">A code from a Cumulus curator or venue host. No code yet? Check in at any listed venue to receive one.</p>
        </div>

        <!-- Host-only extra fields -->
        <div id="gate-host-fields" style="display:none;" class="gate-host-extra">
          <div class="gate-field">
            <label class="gate-label" for="gate-biz-name">Venue or business name</label>
            <input id="gate-biz-name" class="gate-input" placeholder="e.g. The Sketch House" autocomplete="organization"/>
          </div>
          <div class="gate-field-group-label">Event types you'd host</div>
          <div class="host-cat-grid" id="host-cat-grid">
            ${['Creative','Gaming','Movie Nights','Board Games','Meetups','Food &amp; Drink','Live Music','Wellness &amp; Outdoors','Tech &amp; Talks'].map(c=>`<button class="host-cat-chip" data-hostcat="${escapeHtml(c.replace(/&amp;/g,'&'))}" onclick="toggleHostCat('${escapeHtml(c.replace(/&amp;/g,'&'))}')">${c}</button>`).join('')}
          </div>
          <div class="gate-field" style="margin-top:15px;">
            <label class="gate-label" for="gate-host-desc">About your events</label>
            <textarea id="gate-host-desc" class="gate-input" placeholder="What kind of events do you run? Describe the vibe, size, and frequency…" rows="3" maxlength="400"></textarea>
          </div>
          <div class="gate-field">
            <label class="gate-label" for="gate-why-host">Why host on Cumulus?</label>
            <textarea id="gate-why-host" class="gate-input" placeholder="Tell us what you're hoping to achieve…" rows="2" maxlength="300"></textarea>
          </div>
        </div>

        <p id="gate-field-error" class="gate-field-error"></p>
        <button class="lp-claim-btn" onclick="submitGate()">
          <span class="lp-claim-btn-text" id="gate-claim-label">Unlock the map →</span>
          <div class="lp-claim-shimmer"></div>
        </button>

        <div class="lp-form-trust" id="gate-trust-strip">
          <span>Discreet, always</span>
          <span>·</span>
          <span>Members keep 100%</span>
          <span>·</span>
          <span>Leave anytime</span>
        </div>
      </div>
    </div>

  </div>`;

  // Auto-open modal if prefill data was provided (returning user flow)
  if(prefillName||prefillEmail) showLpSignup();

  document.getElementById('gate-name').addEventListener('keydown',e=>{ if(e.key==='Enter') document.getElementById('gate-email').focus(); });
  document.getElementById('gate-email').addEventListener('keydown',e=>{ if(e.key==='Enter') submitGate(); });

  requestAnimationFrame(()=>{
    document.querySelectorAll('.lp-venue-feat').forEach((el,i)=>{
      el.style.opacity='0'; el.style.transform='translateX(-12px)';
      const obs=new IntersectionObserver(entries=>{
        entries.forEach(e=>{ if(e.isIntersecting){ e.target.style.transition=`opacity 0.4s ease ${i*0.09}s, transform 0.4s ease ${i*0.09}s`; e.target.style.opacity='1'; e.target.style.transform='translateX(0)'; obs.unobserve(e.target); } });
      },{threshold:0.2});
      obs.observe(el);
    });
    document.querySelectorAll('.lp-feat-card').forEach((el,i)=>{
      el.style.opacity='0'; el.style.transform='translateY(20px)';
      const obs=new IntersectionObserver(entries=>{
        entries.forEach(e=>{ if(e.isIntersecting){ e.target.style.transition=`opacity 0.45s ease ${i*0.1}s, transform 0.45s cubic-bezier(0.22,1,0.36,1) ${i*0.1}s`; e.target.style.opacity='1'; e.target.style.transform='translateY(0)'; obs.unobserve(e.target); } });
      },{threshold:0.15});
      obs.observe(el);
    });
  });
}

let _signupType = 'attendee';
let _hostCats = [];
let _authMode = 'signup'; // 'signup' | 'login'

function switchAuthMode(mode) {
  _authMode = mode;
  const isLogin = mode === 'login';
  document.getElementById('am-signup')?.classList.toggle('active', !isLogin);
  document.getElementById('am-login')?.classList.toggle('active', isLogin);
  // Sign-up-only sections (class beats CSS !important display via source order)
  const hide = (id, cond) => { const el = document.getElementById(id); if (el) el.classList.toggle('auth-hidden', cond); };
  hide('gate-type-sel', isLogin);
  hide('gate-name-field', isLogin);
  hide('gate-attendee-preview', isLogin || _signupType === 'host');
  hide('gate-host-preview', isLogin || _signupType !== 'host');
  hide('gate-host-fields', isLogin || _signupType !== 'host');
  _updateCuratorVisibility();
  const eyebrow = document.getElementById('gate-form-eyebrow');
  const title   = document.getElementById('gate-form-title');
  const sub     = document.getElementById('gate-form-sub');
  const label   = document.getElementById('gate-claim-label');
  const trust   = document.getElementById('gate-trust-strip');
  if (isLogin) {
    if (eyebrow) eyebrow.textContent = 'Welcome back';
    if (title)   title.textContent   = 'Log in';
    if (sub)     sub.textContent     = 'Enter your email to pick up right where you left off.';
    if (label)   label.textContent   = 'Log in →';
    if (trust)   trust.innerHTML     = '<span>No password needed</span><span>·</span><span>Just your email</span>';
  } else {
    // Restore sign-up copy for the current attendee/host type
    switchSignupType(_signupType);
  }
}

// The curator code is required only when a NEW member is requesting access
// as an attendee — not on login, and not on a host application (hosts are
// vetted through the review queue instead).
function _updateCuratorVisibility() {
  const el = document.getElementById('gate-curator-field');
  if (el) el.style.display = (_authMode === 'signup' && _signupType === 'attendee') ? '' : 'none';
}

function switchSignupType(type) {
  _signupType = type;
  _hostCats = [];
  document.getElementById('gt-attendee').classList.toggle('active', type === 'attendee');
  document.getElementById('gt-host').classList.toggle('active', type === 'host');
  document.getElementById('gate-attendee-preview').style.display = type === 'attendee' ? '' : 'none';
  document.getElementById('gate-host-preview').style.display = type === 'host' ? '' : 'none';
  document.getElementById('gate-host-fields').style.display = type === 'host' ? '' : 'none';
  _updateCuratorVisibility();
  const eyebrow = document.getElementById('gate-form-eyebrow');
  const title   = document.getElementById('gate-form-title');
  const sub     = document.getElementById('gate-form-sub');
  const label   = document.getElementById('gate-claim-label');
  const trust   = document.getElementById('gate-trust-strip');
  if (type === 'host') {
    if (eyebrow) eyebrow.textContent = 'Subject to review · Free to apply';
    if (title)   title.textContent   = 'Apply to host';
    if (sub)     sub.textContent     = 'Tell us about your events. Our team reviews every application to keep quality high on Cumulus.';
    if (label)   label.textContent   = 'Submit application →';
    if (trust)   trust.innerHTML     = '<span>Free to apply</span><span>·</span><span>Reviewed within 48 hrs</span><span>·</span><span>No lock-in</span>';
  } else {
    if (eyebrow) eyebrow.textContent = 'Invite only · Takes 20 seconds';
    if (title)   title.textContent   = 'Request your access';
    if (sub)     sub.textContent     = 'Cumulus is members-only. Enter your curator code to unlock the map — or check in at any venue to earn one.';
    if (label)   label.textContent   = 'Unlock the map →';
    if (trust)   trust.innerHTML     = '<span>Discreet, always</span><span>·</span><span>Members keep 100%</span><span>·</span><span>Leave anytime</span>';
  }
  // Reset chip selections
  document.querySelectorAll('.host-cat-chip').forEach(c => c.classList.remove('active'));
}

function toggleHostCat(cat) {
  const btn = document.querySelector(`[data-hostcat="${CSS.escape(cat)}"]`);
  if (_hostCats.includes(cat)) {
    _hostCats = _hostCats.filter(c => c !== cat);
    if (btn) btn.classList.remove('active');
  } else {
    _hostCats.push(cat);
    if (btn) btn.classList.add('active');
  }
}

function showLpSignup(mode){
  const ov=document.getElementById('lp-signup-overlay');
  if(ov){ ov.classList.add('open'); document.body.style.overflow='hidden'; }
  switchAuthMode(mode==='login'?'login':'signup');
}
function showLpLogin(){ showLpSignup('login'); }
function closeLpSignup(){
  const ov=document.getElementById('lp-signup-overlay');
  if(ov){ ov.classList.remove('open'); document.body.style.overflow=''; }
}
function lpUpdatePassName(val){
  const el=document.getElementById('lp-pass-name-preview');
  if(el) el.textContent=val.trim()||'Your name here';
}
function gateErr(msg){ const el=document.getElementById('gate-field-error'); if(el){el.textContent=msg;el.classList.add('show');} }
// Persist a lightweight session snapshot so a reload can restore instantly and
// still boot the app if Supabase is momentarily unreachable.
function _cacheSession(){
  try{
    localStorage.setItem('cumulus_session', JSON.stringify({
      userId: state.userId, profileId: state.profileId,
      name: state.profileName, email: state.profileEmail,
      specialBadges: state.specialBadges||[], theme: state.theme
    }));
  }catch(e){}
}
function _restoreUserFromRow(existing){
  state.userId=existing.id;
  state.profileId=existing.profile_id||generateUniqueId();
  state.profileName=existing.name;
  state.profileEmail=existing.email;
  state.specialBadges=existing.special_badges||[];
  state.theme=existing.theme||'light';
  applyTheme();
  if(existing.card_bio||existing.card_theme){
    state.myCard={name:existing.name,theme:existing.card_theme||'crimson',bio:existing.card_bio||'',interests:existing.card_interests||'',fact:existing.card_fact||''};
  }
}

async function submitGate(){
  const isLogin = _authMode === 'login';
  const email=(document.getElementById('gate-email').value||'').trim();
  const name=isLogin ? '' : (document.getElementById('gate-name').value||'').trim();
  const errEl=document.getElementById('gate-field-error');
  if(errEl) errEl.classList.remove('show');
  if(!isLogin && !name){ gateErr('Please add your name.'); return; }
  if(!EMAIL_PATTERN.test(email)){ gateErr('Please enter a valid email address.'); return; }

  // Host-specific validation (sign up only)
  let bizName='', hostDesc='', whyHost='';
  if(!isLogin && _signupType==='host'){
    bizName=(document.getElementById('gate-biz-name')?.value||'').trim();
    hostDesc=(document.getElementById('gate-host-desc')?.value||'').trim();
    whyHost=(document.getElementById('gate-why-host')?.value||'').trim();
    if(!bizName){ gateErr('Please enter your venue or business name.'); return; }
    if(_hostCats.length===0){ gateErr('Please select at least one event type.'); return; }
    if(!hostDesc){ gateErr('Please add a brief description of your events.'); return; }
  }

  // Curator code — read here, validated below only once we know this is a
  // brand-new attendee (existing members logging back in don't need one).
  const curatorCode = (!isLogin && _signupType==='attendee')
    ? (document.getElementById('gate-curator')?.value||'').trim() : '';

  // Show loading state
  const btn=document.querySelector('.lp-claim-btn');
  const resetBtn=(labelText)=>{ if(btn){ btn.disabled=false; btn.querySelector('#gate-claim-label').textContent=labelText; } };
  if(btn){ btn.disabled=true; btn.querySelector('#gate-claim-label').textContent=isLogin?'Logging in…':'Setting up…'; }

  // Look up the account by email
  let existing=null;
  try{ const r=await sb.from('users').select('*').eq('email',email).single(); existing=r.data; }
  catch(e){ existing=null; }

  if(isLogin){
    // LOGIN — account must already exist
    if(!(existing&&existing.name)){
      resetBtn('Log in →');
      gateErr('No account found for that email. Switch to Sign up to create one.');
      return;
    }
    _restoreUserFromRow(existing);
  } else if(existing&&existing.name){
    // SIGN UP with an email that already has an account — just log them back in
    _restoreUserFromRow(existing);
    showToast('Welcome back — you already have an account','info');
  } else {
    // NEW member — members-only gate: a new attendee needs a valid curator
    // code (a venue check-in is the alternative way in, handled in-app).
    if(_signupType==='attendee'){
      const cur = await validateCuratorCode(curatorCode);
      if(!cur.valid){
        resetBtn('Unlock the map →');
        gateErr(cur.reason==='inactive'
          ? 'That curator code is no longer active — ask your host for a current one.'
          : 'Enter a valid curator code (CUR-XXXX-XXXX), or check in at a venue to receive one.');
        return;
      }
      state.curatorVerified = true;
      state.curatorCode = cur.code;
      state.curatorTier = cur.tier || 'standard';
    }
    // NEW user — create in Supabase
    state.profileName=name;
    state.profileEmail=email;
    state.specialBadges=[];
    state.profileId=generateUniqueId();
    try{
      const {data:created,error}=await sb.from('users').insert({
        name,email,profile_id:state.profileId,special_badges:[],theme:'light'
      }).select().single();
      if(error) throw error;
      if(created) state.userId=created.id;
    }catch(e){
      console.error('Sign up failed:',e);
      resetBtn('Unlock the map →');
      gateErr('Could not create your account — please try again.');
      return;
    }
  }

  // Cache session locally (email + lightweight snapshot for offline restore)
  await localSet('cumulus_email',email);
  await localSet('prefs',JSON.stringify({theme:state.theme}));
  _cacheSession();

  // Host application flow (sign up only)
  if(!isLogin && _signupType==='host'){
    await _submitHostApplication({name,email,bizName,hostDesc,whyHost});
    return;
  }

  document.body.style.overflow='';
  document.getElementById('gate-root').innerHTML='';
  enterApp();
}

async function _submitHostApplication({name,email,bizName,hostDesc,whyHost}){
  const appPayload={
    name, email,
    user_id: state.userId||null,
    business_name: bizName,
    event_types: _hostCats.join(','),
    description: hostDesc,
    why_host: whyHost,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  // Try Supabase first; fall back to localStorage
  let savedToDb=false;
  try{
    const {error}=await sb.from('host_applications').insert(appPayload);
    if(!error) savedToDb=true;
  }catch(e){}

  if(!savedToDb){
    try{
      const apps=JSON.parse(localStorage.getItem('host_applications_local')||'[]');
      apps.push({...appPayload, id: 'local_'+Date.now()});
      localStorage.setItem('host_applications_local',JSON.stringify(apps));
    }catch(e){}
  }

  // Show success screen inside modal
  const modal=document.querySelector('.lp-signup-modal');
  if(modal){
    modal.innerHTML=`
      <div class="gate-host-success">
        <div class="gate-host-success-icon">🎉</div>
        <div class="gate-host-success-title">Application submitted!</div>
        <div class="gate-host-success-sub">Thanks ${escapeHtml(name)} — we'll review your application and get back to you within 48 hours. In the meantime, you can explore Cumulus as an attendee.</div>
        <button class="btn" style="width:100%;margin-top:24px;" onclick="document.body.style.overflow='';document.getElementById('gate-root').innerHTML='';enterApp();">Explore Cumulus →</button>
      </div>`;
  }
}
// Cloud loading transition removed — enter the app directly.

function enterApp() {
  const app = document.getElementById('app');
  app.style.display = '';
  // Always boot to the map — never restore a stale tab from memory
  state.view = 'browse';
  EVENTS.forEach(ev => computeEventDates(ev));
  renderNav();
  renderView();
  // Load real data in the background without blocking
  initApp();
}

function openCardEditor(eventId){
  cardEditorEventId=eventId??null;
  const ex=state.myCard;
  // Load extended fields from localStorage
  let ext={};
  try{ const r=localStorage.getItem('card_ext:'+state.profileName); if(r) ext=JSON.parse(r); }catch(e){}
  let savedPhoto='';
  try{ savedPhoto=localStorage.getItem('card_photo:'+state.profileName)||''; }catch(e){}
  const savedBg=ext.bgStyle||ex?.theme||'obsidian';
  const savedAccent=ext.accentColor||ex?.accentColor||'#CBA43A';
  const savedOpacity=ext.patternOpacity!=null?ext.patternOpacity:0.35;
  cardDraft=ex
    ?{theme:savedBg,bgStyle:savedBg,accentColor:savedAccent,pattern:ext.pattern||'lightning',patternOpacity:savedOpacity,bio:ex.bio||'',interests:ex.interests||'',fact:ex.fact||'',motto:ext.motto||'',photo:savedPhoto,areas:ext.areas||[]}
    :{theme:'obsidian',bgStyle:'obsidian',accentColor:'#CBA43A',pattern:'constellation',patternOpacity:0.35,bio:'',interests:'',fact:'',motto:'',photo:savedPhoto,areas:ext.areas||[]};
  renderCardEditor();
}
function captureDraftFields(){
  const b=document.getElementById('card-bio'); if(b) cardDraft.bio=b.value;
  const i=document.getElementById('card-interests'); if(i) cardDraft.interests=i.value;
  const f=document.getElementById('card-fact'); if(f) cardDraft.fact=f.value;
  const m=document.getElementById('card-motto'); if(m) cardDraft.motto=m.value;
}
function handleCardPhoto(input){
  const file=input.files&&input.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=function(e){
    // Resize to max 480px to keep localStorage size manageable
    const img=new Image();
    img.onload=function(){
      const MAX=480;
      let w=img.width, h=img.height;
      if(w>h){ if(w>MAX){h=Math.round(h*MAX/w);w=MAX;} } else { if(h>MAX){w=Math.round(w*MAX/h);h=MAX;} }
      const canvas=document.createElement('canvas'); canvas.width=w; canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      cardDraft.photo=canvas.toDataURL('image/jpeg',0.78);
      // Update zone UI without full re-render
      const zone=document.getElementById('ce-photo-zone');
      if(zone) zone.innerHTML=`<input type="file" id="ce-photo-input" accept="image/*" onchange="handleCardPhoto(this)"/>
        <img src="${cardDraft.photo}" class="ce-photo-about-img" id="ce-photo-img" alt=""/>
        <div class="ce-photo-about-lbl">Tap to change<span>Shows in your card corner</span></div>
        <button class="ce-photo-remove" style="margin-left:auto;font-size:10px;" onclick="event.stopPropagation();removeCardPhoto()">Remove</button>`;
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}
function removeCardPhoto(){
  cardDraft.photo='';
  try{ localStorage.removeItem('card_photo:'+state.profileName); }catch(e){}
  const zone=document.getElementById('ce-photo-zone');
  if(zone) zone.innerHTML=`<input type="file" id="ce-photo-input" accept="image/*" onchange="handleCardPhoto(this)"/>
    <div style="width:48px;height:48px;border-radius:50%;background:var(--line);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="opacity:0.45;"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>
    </div>
    <div class="ce-photo-about-lbl">Add photo<span>Shows in your card corner</span></div>`;
}
function selectCardTheme(id){
  captureDraftFields();
  cardDraft.theme=id; cardDraft.bgStyle=id;
  updateCardPreview();
  document.querySelectorAll('.cc-style-btn').forEach(b=>b.classList.toggle('active',b.dataset.id===id));
}
function selectCardAccentColor(hex, id){
  captureDraftFields();
  cardDraft.accentColor=hex;
  updateCardPreview();
  document.querySelectorAll('.cc-swatch').forEach(b=>b.classList.toggle('active',b.dataset.id===id));
}
function selectCardPattern(pat){
  captureDraftFields();
  cardDraft.pattern=pat;
  updateCardPreview();
  document.querySelectorAll('.cc-pattern-btn').forEach(b=>b.classList.toggle('active',b.dataset.pat===pat));
}
function setPatternOpacity(val){
  cardDraft.patternOpacity=parseFloat(val);
  const pat=document.getElementById('ce-pattern');
  if(pat) pat.style.opacity=cardDraft.patternOpacity;
  const lbl=document.getElementById('ce-opacity-val');
  if(lbl) lbl.textContent=Math.round(cardDraft.patternOpacity*100)+'%';
}
function toggleCardArea(area){
  const idx=cardDraft.areas.indexOf(area);
  if(idx!==-1){ cardDraft.areas.splice(idx,1); }
  else if(cardDraft.areas.length<3){ cardDraft.areas.push(area); }
  // Patch pills without re-render
  document.querySelectorAll('.ce-area-pill').forEach(btn=>{
    const a=btn.dataset.area;
    const sel=cardDraft.areas.includes(a);
    btn.classList.toggle('active',sel);
    btn.disabled=!sel&&cardDraft.areas.length>=3;
  });
  const hint=document.getElementById('ce-area-hint');
  if(hint) hint.textContent=`${cardDraft.areas.length}/3 selected${cardDraft.areas.length===3?' · tap to deselect':''}`;
  const det=document.getElementById('ce-preview-detail');
  if(det) det.textContent=cardDraft.areas.length?cardDraft.areas.join(' · '):'London Community Member';
}
function updateCardPreview(){
  const t=resolveCardColors(cardDraft.bgStyle||cardDraft.theme, cardDraft.accentColor);
  const el=document.getElementById('ce-live-card');
  if(!el) return;
  el.style.background=t.bg;
  el.style.color=t.text;
  el.style.borderColor=t.border;
  const pat=document.getElementById('ce-pattern');
  if(pat){ pat.style.color=t.accent; pat.style.opacity=cardDraft.patternOpacity||0.18; pat.innerHTML=CARD_PATTERNS[cardDraft.pattern]||''; }
  const nm=document.getElementById('ce-preview-name');
  if(nm) nm.style.color=t.text;
  const ac=document.getElementById('ce-preview-accent');
  if(ac) ac.style.background=t.accent;
  const bio=document.getElementById('card-bio');
  const pbio=document.getElementById('ce-preview-bio');
  if(pbio&&bio){ pbio.textContent=bio.value||'Tell your story…'; pbio.style.color=t.textSoft; }
  const motto=document.getElementById('card-motto');
  const pmotto=document.getElementById('ce-preview-motto');
  if(pmotto&&motto){ pmotto.textContent=motto.value?`"${motto.value}"`:''; pmotto.style.color=t.accent; }
  const tags=document.getElementById('ce-preview-tags');
  const int=document.getElementById('card-interests');
  if(tags&&int){
    const items=(int.value||'').split(',').map(s=>s.trim()).filter(Boolean).slice(0,5);
    tags.innerHTML=items.map(s=>`<span class="ce-preview-tag" style="border-color:${t.accent};color:${t.text};">${escapeHtml(s)}</span>`).join('');
  }
  const lbl=document.getElementById('ce-preview-label');
  if(lbl) lbl.style.color=t.textSoft;
  const det=document.getElementById('ce-preview-detail');
  if(det){ det.style.color=t.textSoft; det.textContent=cardDraft.areas.length?cardDraft.areas.join(' · '):'London Community Member'; }
  const wm=document.getElementById('ce-preview-wm');
  if(wm) wm.style.color=t.accent;
  const ph=document.getElementById('ce-preview-photo');
  if(ph&&ph.tagName==='IMG'){ ph.style.borderColor=t.accent; }
}
function renderCardEditor(){
  const allowSkip=cardEditorEventId!==null;
  const t=resolveCardColors(cardDraft.bgStyle||cardDraft.theme, cardDraft.accentColor);

  // Build color swatch grid by color family
  const colorFamilies=[
    {label:'Blues',           ids:['sky','blue','cobalt-ac','sapphire','navy','ice','periwinkle','cerulean','steel','powder','azure','denim-ac','ocean-ac','cobalt-light','powder-deep']},
    {label:'Purples',         ids:['violet','purple','lavender','indigo','grape','mauve','lilac','heather','amethyst-ac','byzantium','wisteria','aubergine-ac','orchid-ac']},
    {label:'Pinks & Reds',    ids:['hot-pink','rose-ac','crimson-ac','coral','blush-ac','magenta','scarlet','flamingo','salmon','ruby','candy','cherry-ac','bubblegum','cerise','carnation']},
    {label:'Oranges & Yellows',ids:['amber','gold','tangerine','peach','copper-ac','honey','sunshine','butter','saffron','apricot','mustard','burnt-orange','lemon','goldenrod']},
    {label:'Greens',          ids:['emerald','mint','jade-ac','sage-ac','lime','teal','seafoam','moss','forest-ac','olive','lime-green','pine-green','viridian','sage-green','hunter']},
    {label:'Warm Tones',      ids:['terracotta','brick','rust','bronze','hazel','maple','cinnamon']},
    {label:'Cool Tones',      ids:['slate-blue-ac','arctic-ac','powder-blue','muted-teal','seafoam-deep','mint-fresh','glacier']},
    {label:'Neutrals',        ids:['white','silver','platinum','champagne','sand','slate-ac','warm-white','oyster','stone','pewter','graphite-ac']},
    {label:'Metallics',       ids:['gold-foil','rose-gold-ac','neon-cyan']},
  ];
  const colorSwatchesHtml=colorFamilies.map(fam=>`
    <div class="cc-family-label">${fam.label}</div>
    <div class="cc-color-grid">
      ${fam.ids.map(cid=>{
        const c=CARD_ACCENT_COLORS.find(x=>x.id===cid); if(!c) return '';
        const isActive=cardDraft.accentColor===c.hex;
        return `<button class="cc-swatch${isActive?' active':''}" data-id="${c.id}" title="${c.name}"
          style="background:${c.hex};"
          onclick="selectCardAccentColor('${c.hex}','${c.id}')">
          <span class="cc-swatch-label">${c.name}</span>
        </button>`;
      }).join('')}
    </div>`).join('');

  // Build background style grid
  const styleFamilies=[
    {label:'Dark Tones',    ids:['midnight','obsidian','charcoal','slate','ink','abyss','noir','volcanic','cosmos','carbon','graphite','pitch','nightfall','anthracite','void']},
    {label:'Light Tones',   ids:['cloud','pearl','cream','cotton','frost','linen-bg','chalk','mist','blush','sage-light','snow','ivory','eggshell','lilac-mist','peach-mist']},
    {label:'Rich & Deep',   ids:['ocean','forest','cherry','cobalt','jade','amber-dark','plum','crimson','denim','copper-bg','burgundy','pine','aubergine','mahogany','steel-dark']},
    {label:'Gradient Moods',ids:['aurora','sunset','twilight','deepspace','summer','arctic','jungle','lagoon','fire','violet-storm','ember','northern-lights','galaxy','bloom','citrus','rose-gold','forest-floor','prism','vapor','mango-glow','midnight-ocean','magma','royal-purple','deep-teal','spring','arctic-dawn','amethyst','deep-rose','peach-glow','forest-night']},
    {label:'Cloud Classics',ids:['storm','nimbus','electric','thunder','cirrus','dusk','overcast','haze','squall','altitude']},
    {label:'Vintage & Warm',ids:['sepia','warm-stone','terracotta-bg','parchment','antique','washed-denim','dusty-rose','harvest','cedar','tobacco','wheat','clay','bourbon','sand-dune','amber-cream']},
  ];
  const styleGridHtml=styleFamilies.map(fam=>`
    <div class="cc-family-label">${fam.label}</div>
    <div class="cc-style-grid">
      ${fam.ids.map(sid=>{
        const s=CARD_BG_STYLES.find(x=>x.id===sid); if(!s) return '';
        const isActive=(cardDraft.bgStyle||cardDraft.theme)===s.id;
        const nameColor=s.dark?'rgba(255,255,255,0.85)':'rgba(0,0,0,0.72)';
        return `<button class="cc-style-btn${isActive?' active':''}" data-id="${s.id}"
          onclick="selectCardTheme('${s.id}')" title="${s.name}">
          <div class="cc-style-preview" style="background:${s.bg};">
            <span class="cc-style-name" style="color:${nameColor};">${s.name}</span>
          </div>
        </button>`;
      }).join('')}
    </div>`).join('');

  // Pattern grid — vibrant (opacity controlled by slider)
  const patternOptions=[
    {id:'none',          label:'✕  None'},
    {id:'lines',         label:'// Lines'},
    {id:'mesh',          label:'⊞ Mesh'},
    {id:'dots',          label:'· Dots'},
    {id:'grid',          label:'⊟ Grid'},
    {id:'diagonal',      label:'⟋ Diagonal'},
    {id:'zigzag',        label:'⟨⟩ Zigzag'},
    {id:'dashes',        label:'— Dashes'},
    {id:'halftone',      label:'⠿ Halftone'},
    {id:'hexgrid',       label:'⬡ Hex'},
    {id:'topo',          label:'⌇ Topo'},
    {id:'triangles',     label:'△ Triangles'},
    {id:'constellation', label:'✦ Stars'},
    {id:'blueprint',     label:'⊕ Blueprint'},
    {id:'waves',         label:'∿ Waves'},
    {id:'marble',        label:'⌁ Marble'},
    {id:'sparkle',       label:'✴ Sparkle'},
    {id:'circuits',      label:'⊛ Circuit'},
    {id:'plus',          label:'+ Plus'},
    {id:'rings',         label:'◎ Rings'},
    {id:'sunburst',      label:'☀ Rays'},
    {id:'petals',        label:'❀ Petals'},
    {id:'cobweb',        label:'⊙ Cobweb'},
    {id:'linen',         label:'▦ Weave'},
  ];
  const patternTabHtml=`<div class="cc-pattern-grid">
    ${patternOptions.map(p=>`<button class="cc-pattern-btn${cardDraft.pattern===p.id?' active':''}" data-pat="${p.id}" onclick="selectCardPattern('${p.id}')">${p.label}</button>`).join('')}
  </div>`;

  const areaPillsHtml=LONDON_AREAS.map(a=>{
    const sel=cardDraft.areas.includes(a);
    const disabled=!sel&&cardDraft.areas.length>=3;
    return `<button class="ce-area-pill${sel?' active':''}" data-area="${escapeHtml(a)}" onclick="toggleCardArea('${escapeHtml(a)}')" ${disabled?'disabled':''}>${escapeHtml(a)}</button>`;
  }).join('');

  const liveCardHtml=`<div class="ce-live-card" id="ce-live-card" style="background:${t.bg};border-color:${t.border};">
    <div class="ce-pattern" id="ce-pattern" style="color:${t.accent};opacity:${cardDraft.patternOpacity||0.35};">${CARD_PATTERNS[cardDraft.pattern]||''}</div>
    ${cardDraft.photo?`<img src="${cardDraft.photo}" id="ce-preview-photo" style="position:absolute;top:0;right:0;width:56px;height:56px;object-fit:cover;border-radius:0 6px 0 10px;border-left:1.5px solid ${t.accent};border-bottom:1.5px solid ${t.accent};z-index:3;" alt=""/>`:
      `<div id="ce-preview-photo"></div>`}
    <div class="ce-card-shine"></div>
    <div class="ce-card-body">
      <div class="ce-card-top-row">
        <div>
          <div class="ce-preview-label" id="ce-preview-label" style="color:${t.textSoft};">// Cumulus Pass</div>
          <div class="ce-preview-accent" id="ce-preview-accent" style="background:${t.accent};"></div>
        </div>
      </div>
      <div class="ce-preview-name" id="ce-preview-name" style="color:${t.text};">${escapeHtml(state.profileName||'Your Name')}</div>
      <div class="ce-preview-motto" id="ce-preview-motto" style="color:${t.accent};">${cardDraft.motto?`"${escapeHtml(cardDraft.motto)}"`:''}</div>
      <div class="ce-preview-bio" id="ce-preview-bio" style="color:${t.textSoft};">${cardDraft.bio||'Tell your story…'}</div>
      <div class="ce-preview-tags" id="ce-preview-tags">
        ${(cardDraft.interests||'').split(',').map(s=>s.trim()).filter(Boolean).slice(0,5).map(s=>`<span class="ce-preview-tag" style="border-color:${t.accent};color:${t.text};">${escapeHtml(s)}</span>`).join('')}
      </div>
      <div class="ce-preview-detail" id="ce-preview-detail" style="color:${t.textSoft};">${cardDraft.areas.length?cardDraft.areas.join(' · '):'London Community Member'}</div>
    </div>
    <div class="ce-preview-wm" id="ce-preview-wm" style="color:${t.accent};">CU</div>
  </div>`;

  document.getElementById('card-editor-root').innerHTML=`
  <div class="ce-overlay">

    <!-- Top bar -->
    <div class="ce-topbar">
      <button class="ce-topbar-back" onclick="closeCardEditor()">←</button>
      <div class="ce-topbar-title">Card builder</div>
      <div style="display:flex;gap:6px;align-items:center;">
        ${allowSkip?`<button class="ce-topbar-skip" onclick="skipCard()">Skip</button>`:''}
        <button class="ce-topbar-save" onclick="saveCard()">Save</button>
      </div>
    </div>

    <!-- Split: preview | controls -->
    <div class="ce-shell">

      <!-- LEFT — live card preview only -->
      <div class="ce-left">
        <div class="ce-card-wrap">
          ${liveCardHtml}
        </div>
        <div class="ce-spin-hint">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
          Drag to spin
        </div>
        <div class="ce-left-actions">
          <button class="btn" style="flex:1;" onclick="saveCard()">Save card</button>
          ${allowSkip
            ?`<button class="btn btn-outline" onclick="skipCard()">Skip</button>`
            :`<button class="btn btn-outline" onclick="closeCardEditor()">Cancel</button>`}
        </div>
      </div>

      <!-- RIGHT — tabbed controls -->
      <div class="ce-right">

        <!-- Tab bar: Card Base | Pattern | Accent | About You -->
        <div class="ce-tabs-bar">
          <button class="ce-tab-btn active" data-tab="base"    onclick="switchCeTab('base')">Card Base</button>
          <button class="ce-tab-btn"        data-tab="pattern" onclick="switchCeTab('pattern')">Pattern</button>
          <button class="ce-tab-btn"        data-tab="accent"  onclick="switchCeTab('accent')">Accent</button>
          <button class="ce-tab-btn"        data-tab="about"   onclick="switchCeTab('about')">About You</button>
        </div>

        <!-- ─ CARD BASE TAB ─ -->
        <div class="ce-tab-panel active" data-tab="base">
          <div class="ce-section">
            <div class="ce-section-label">Card background</div>
            ${styleGridHtml}
          </div>
        </div>

        <!-- ─ PATTERN TAB ─ -->
        <div class="ce-tab-panel" data-tab="pattern">
          <div class="ce-section">
            <div class="ce-section-label">Pattern overlay</div>
            ${patternTabHtml}
          </div>
          <div class="ce-section">
            <div class="ce-section-label">Pattern intensity</div>
            <div class="ce-intensity-bar">
              <input type="range" id="ce-opacity-global" min="0.02" max="0.85" step="0.01"
                value="${cardDraft.patternOpacity||0.35}"
                style="flex:1;accent-color:var(--accent);cursor:pointer;"
                oninput="setPatternOpacity(this.value)"/>
              <span class="ce-intensity-pct" id="ce-opacity-val">${Math.round((cardDraft.patternOpacity||0.35)*100)}%</span>
            </div>
          </div>
        </div>

        <!-- ─ ACCENT TAB ─ -->
        <div class="ce-tab-panel" data-tab="accent">
          <div class="ce-section">
            <div class="ce-section-label">Highlight colour</div>
            ${colorSwatchesHtml}
          </div>
        </div>

        <!-- ─ ABOUT YOU TAB ─ -->
        <div class="ce-tab-panel" data-tab="about">

          <div class="ce-section">
            <div class="ce-section-label">Your photo <span class="ce-optional">optional</span></div>
            <div class="ce-photo-about" id="ce-photo-zone">
              <input type="file" id="ce-photo-input" accept="image/*" onchange="handleCardPhoto(this)"/>
              ${cardDraft.photo
                ?`<img src="${cardDraft.photo}" class="ce-photo-about-img" id="ce-photo-img" alt=""/>
                  <div class="ce-photo-about-lbl">Tap to change<span>Shows in your card corner</span></div>
                  <button class="ce-photo-remove" style="margin-left:auto;font-size:10px;" onclick="event.stopPropagation();removeCardPhoto()">Remove</button>`
                :`<div style="width:48px;height:48px;border-radius:50%;background:var(--line);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="opacity:0.45;"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>
                  </div>
                  <div class="ce-photo-about-lbl">Add photo<span>Shows in your card corner</span></div>`}
            </div>
          </div>

          <div class="ce-section">
            <div class="ce-section-label">Your motto <span class="ce-optional">optional · 60 chars</span></div>
            <input id="card-motto" class="ce-input" placeholder="e.g. Always up for something new" value="${escapeHtml(cardDraft.motto)}" oninput="updateCardPreview()" autocomplete="off" maxlength="60"/>
            <div class="ce-char-hint">Shown in italic under your name</div>
          </div>

          <div class="ce-section">
            <div class="ce-section-label">About you <span class="ce-optional">optional</span></div>
            <textarea id="card-bio" class="ce-input ce-textarea" rows="3" placeholder="What brings you to events like these?" oninput="updateCardPreview()">${escapeHtml(cardDraft.bio)}</textarea>
          </div>

          <div class="ce-section">
            <div class="ce-section-label">Interests <span class="ce-optional">comma separated</span></div>
            <input id="card-interests" class="ce-input" placeholder="e.g. live music, board games, hiking" value="${escapeHtml(cardDraft.interests)}" oninput="updateCardPreview()" autocomplete="off"/>
            <div class="ce-char-hint">Shown as tags on your card</div>
          </div>

          <div class="ce-section">
            <div class="ce-section-label">Fun fact <span class="ce-optional">optional</span></div>
            <input id="card-fact" class="ce-input" placeholder="e.g. once got lost in IKEA for 3 hours" value="${escapeHtml(cardDraft.fact)}" oninput="updateCardPreview()" autocomplete="off"/>
          </div>

          <div class="ce-section">
            <div class="ce-section-label">Your local spots <span class="ce-optional">pick up to 3</span></div>
            <div class="ce-char-hint" id="ce-area-hint" style="margin-bottom:14px;">${cardDraft.areas.length}/3 selected${cardDraft.areas.length===3?' — tap any to deselect':''}</div>
            <div class="ce-area-grid" id="ce-area-grid">${areaPillsHtml}</div>
          </div>

          <div class="ce-save-row">
            <button class="btn" style="flex:1;" onclick="saveCard()">Save card</button>
            ${allowSkip?`<button class="btn btn-outline" onclick="skipCard()">Skip</button>`:`<button class="btn btn-outline" onclick="closeCardEditor()">Cancel</button>`}
          </div>

        </div>

      </div><!-- /ce-right -->
    </div><!-- /ce-shell -->
  </div>`;
  // 3D drag-to-spin with spring return
  const liveCard=document.getElementById('ce-live-card');
  liveCard.style.cursor='grab';
  let _ceSpin=false,_ceStartX=0,_ceStartY=0,_cePrevX=0,_cePrevY=0;
  let _ceRotY=0,_ceRotX=0,_ceVelY=0,_ceVelX=0,_ceRaf=0;
  function _ceSetT(ry,rx){ liveCard.style.transform=`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`; }
  function _ceSpring(){
    _ceVelY=_ceVelY*0.82-_ceRotY*0.12;
    _ceVelX=_ceVelX*0.82-_ceRotX*0.12;
    _ceRotY+=_ceVelY; _ceRotX+=_ceVelX;
    _ceSetT(_ceRotY,_ceRotX);
    if(Math.abs(_ceRotY)<0.1&&Math.abs(_ceRotX)<0.1&&Math.abs(_ceVelY)<0.1&&Math.abs(_ceVelX)<0.1){
      _ceRotY=0;_ceRotX=0;_ceVelY=0;_ceVelX=0;_ceSetT(0,0);
    } else { _ceRaf=requestAnimationFrame(_ceSpring); }
  }
  liveCard.addEventListener('pointerdown',e=>{
    _ceSpin=true;_ceStartX=_cePrevX=e.clientX;_ceStartY=_cePrevY=e.clientY;
    _ceRotY=0;_ceRotX=0;_ceVelY=0;_ceVelX=0;
    cancelAnimationFrame(_ceRaf);
    liveCard.setPointerCapture(e.pointerId);
    liveCard.style.cursor='grabbing';
    e.preventDefault();
  });
  liveCard.addEventListener('pointermove',e=>{
    if(!_ceSpin) return;
    const dx=e.clientX-_ceStartX, dy=e.clientY-_ceStartY;
    _ceVelY=(e.clientX-_cePrevX)*0.18; _ceVelX=-(e.clientY-_cePrevY)*0.12;
    _cePrevX=e.clientX; _cePrevY=e.clientY;
    _ceRotY=dx*0.18; _ceRotX=-dy*0.12;
    _ceSetT(_ceRotY,_ceRotX);
  });
  const _ceEnd=()=>{ if(!_ceSpin)return; _ceSpin=false; liveCard.style.cursor='grab'; _ceRaf=requestAnimationFrame(_ceSpring); };
  liveCard.addEventListener('pointerup',_ceEnd);
  liveCard.addEventListener('pointercancel',_ceEnd);
}
function switchCeTab(tab){
  captureDraftFields();
  document.querySelectorAll('.ce-tab-btn').forEach(b=>
    b.classList.toggle('active', b.dataset.tab===tab)
  );
  document.querySelectorAll('.ce-tab-panel').forEach(p=>
    p.classList.toggle('active', p.dataset.tab===tab)
  );
}
async function saveCard(){
  captureDraftFields();
  const card={name:state.profileName,theme:cardDraft.bgStyle||cardDraft.theme,bgStyle:cardDraft.bgStyle||cardDraft.theme,accentColor:cardDraft.accentColor||'#CBA43A',bio:cardDraft.bio.trim(),interests:cardDraft.interests.trim(),fact:cardDraft.fact.trim()};
  state.myCard=card;
  // Save extended fields to localStorage
  try{ localStorage.setItem('card_ext:'+state.profileName, JSON.stringify({pattern:cardDraft.pattern,patternOpacity:cardDraft.patternOpacity,motto:cardDraft.motto,areas:cardDraft.areas,accentColor:cardDraft.accentColor,bgStyle:cardDraft.bgStyle})); }catch(e){}
  // Save photo separately (can be large)
  try{ if(cardDraft.photo) localStorage.setItem('card_photo:'+state.profileName, cardDraft.photo);
       else localStorage.removeItem('card_photo:'+state.profileName); }catch(e){}
  if(state.userId){
    await sb.from('users').update({
      card_theme:card.theme,card_bio:card.bio,card_interests:card.interests,card_fact:card.fact
    }).eq('id',state.userId);
  }
  document.getElementById('card-editor-root').innerHTML='';
  renderNav();
  if(cardEditorEventId!==null){ openConnect(cardEditorEventId); } else { renderView(); }
}
function skipCard(){ document.getElementById('card-editor-root').innerHTML=''; if(cardEditorEventId!==null) openConnect(cardEditorEventId); }
function closeCardEditor(){ document.getElementById('card-editor-root').innerHTML=''; }
function openConnectGateway(id){ if(state.myCard) openConnect(id); else openCardEditor(id); }

async function initApp(){
  // Background data load — enterApp() already rendered the UI with seed data.
  // This enriches it once Supabase responds without blocking the cloud animation.
  await loadRealEvents();

  await loadGeocodeCache();
  EVENTS.forEach(ev=>{ if(needsGeocode(ev)&&geocodeCache[ev.address]){ ev.lat=geocodeCache[ev.address].lat; ev.lon=geocodeCache[ev.address].lon; } });
  if(mapboxConfigured()) resolveEventLocations();

  await loadMyTickets();
  await loadAllRsvps();

  if(!state.myCard){
    const cardRaw=await localGet(`card:${state.profileName}`);
    if(cardRaw){ try{ state.myCard=JSON.parse(cardRaw); }catch(e){} }
  }

  await loadFriends();
  // Refresh view quietly once real data is in (still on map = update markers)
  if(state.view==='browse') renderView();
}

// ── Supabase data loaders ─────────────────────────────────────────────────

async function loadRealEvents(){
  const {data}=await sb.from('events').select('*').order('start_time',{ascending:true});
  if(!data) return;
  data.forEach(ev=>{
    // Don't duplicate seed events (they use numeric IDs 1-100)
    if(EVENTS.find(e=>e.id===ev.id)) return;
    const mapped={
      id:ev.id, title:ev.title, category:ev.category,
      host:ev.host_name, hostId:ev.host_id,
      venue:ev.venue, area:ev.area, address:ev.address,
      lat:ev.lat, lon:ev.lon,
      startTime:ev.start_time, endTime:ev.end_time,
      desc:ev.description, capacity:ev.capacity, price:ev.price||0,
      nightShotUrl:ev.night_shot_url||null
    };
    computeEventDates(mapped);
    EVENTS.push(mapped);
  });
}

async function loadAllRsvps(){
  const {data}=await sb.from('rsvps').select('event_id,user_name');
  if(!data) return;
  data.forEach(r=>{
    if(!state.rsvps[r.event_id]) state.rsvps[r.event_id]=[];
    if(!state.rsvps[r.event_id].includes(r.user_name)) state.rsvps[r.event_id].push(r.user_name);
  });
}

async function loadFriends(){
  if(!state.userId) return;
  const {data}=await sb.from('friends').select('friend_name').eq('user_id',state.userId);
  if(data){
    const fromDb=data.map(f=>f.friend_name);
    // Merge: keep in-session additions not yet in DB, avoid duplicates
    const merged=[...new Set([...fromDb,...state.friends])];
    state.friends=merged;
  }
}

async function addFriend(friendName,friendUserId){
  if(state.friends.includes(friendName)) return;
  await sb.from('friends').insert({user_id:state.userId,friend_id:friendUserId,friend_name:friendName});
  state.friends.push(friendName);
  renderView();
}

function renderNav(){
  const activeTab = ['tickets','my-tickets','book','checkout','confirmed','owner-dash','review','achievements'].includes(state.view)?'profile'
    :['social','friends','host'].includes(state.view)?'social'
    :['calendar','calendar-day'].includes(state.view)?'calendar'
    :state.view;
  const unread = getUnreadSocialCount();
  const navContainer = document.getElementById('nav-container');

  // First render: build the full DOM once
  if(!navContainer.querySelector('.bottom-nav')){
    const icons={
      browse:`<svg class="nav-icon" viewBox="0 0 24 24"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>`,
      tickets:`<svg class="nav-icon" viewBox="0 0 24 24"><path d="M20 12c0-1.1.9-2 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v4c1.1 0 2 .9 2 2s-.9 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2zm-6 3.5h-4v-2h4v2zm0-5h-4v-2h4v2z"/></svg>`,
      social:`<svg class="nav-icon" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>`,
      calendar:`<svg class="nav-icon" viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"/></svg>`,
      host:`<svg class="nav-icon" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
      profile:`<svg class="nav-icon" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
      review:`<svg class="nav-icon" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>`
    };
    const NAV_TABS=[
      {label:'Explore', v:'browse',   action:'goBrowse()'},
      {label:'Social',  v:'social',   action:'navStack=[];openSocialTab()'},
      {label:'Calendar',v:'calendar', action:'navStack=[];openCalendar()'},
      {label:'Profile', v:'profile',  action:'navStack=[];openProfile()'},
    ];
    navContainer.innerHTML=`
      <div class="top-bar">
        <div class="logo-wrap" onclick="goBrowse()">${BLOT_SVG}<span class="logo hide-mobile">Cumulus</span></div>
        <input id="search-input" class="search-input" placeholder="Search events..." oninput="onSearchInput()" autocomplete="off"/>
        <button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme" title="${state.theme==='dark'?'Switch to light mode':'Switch to dark mode'}">${state.theme==='dark'?'☀':'🌙'}</button>
      </div>
      <div class="bottom-nav">
        ${NAV_TABS.map(({label,v,action})=>`
          <button class="nav-link" data-nav="${v}" onclick="${action}" style="position:relative;">
            ${icons[v]||''}
            <span class="nav-social-badge" style="display:none;position:absolute;top:4px;right:calc(50% - 22px);background:#E23B3B;color:#fff;font-size:9px;font-weight:800;min-width:16px;height:16px;border-radius:8px;align-items:center;justify-content:center;padding:0 3px;border:1.5px solid var(--surface);"></span>
            <span>${label}</span>
          </button>`).join('')}
      </div>`;
  }

  // Every call: patch active state and theme toggle — no DOM destruction
  navContainer.querySelectorAll('.nav-link').forEach(btn=>{
    btn.classList.toggle('active-cloud-tab', btn.dataset.nav===activeTab);
  });
  const themBtn=navContainer.querySelector('.theme-toggle');
  if(themBtn) themBtn.textContent=state.theme==='light'?'◑':'◐';

  // Patch social badge without touching other buttons
  const socialBadge=navContainer.querySelector('[data-nav="social"] .nav-social-badge');
  if(socialBadge){
    if(unread>0){ socialBadge.textContent=unread; socialBadge.style.display='flex'; }
    else { socialBadge.style.display='none'; }
  }
}

function onSearchInput(){ if(state.view!=='browse'){ state.view='browse'; state.selectedEventId=null; } renderView(); }
function destroyMainMap(){
  if(lmap){
    try{
      closeActivePopup();
      Object.values(htmlMarkerRefs).forEach(ref=>{
        if(ref.added){ ref.marker.remove(); if(ref.bubbleMarker) ref.bubbleMarker.remove(); }
      });
      htmlMarkerRefs={};
      lmap.remove();
    }catch(e){}
    lmap=null; lmapFitted=false;
  }
}
function destroyHostMap(){ if(hostMap){ try{ hostMap.remove(); }catch(e){} hostMap=null; hostMarker=null; } }

// Dedicated sign-out — tears the session down cleanly and returns to the gate.
// Confirms first unless called with confirmed=true (e.g. from clearAllUsers).
async function signOut(confirmed){
  if(!confirmed){ showConfirm('Sign out?','You\'ll return to the welcome screen. Your data is saved.','Sign out','signOut'); return; }
  // Clear any Supabase auth session (defensive — harmless if none is active,
  // and future-proofs a move to real sb.auth without leaving a token behind).
  try{ await sb.auth.signOut(); }catch(e){}
  // Clear local session cache
  try{ localStorage.removeItem('cumulus_email'); }catch(e){}
  try{ localStorage.removeItem('cumulus_session'); }catch(e){}
  try{ localStorage.removeItem('prefs'); }catch(e){}
  // Unsubscribe from all realtime channels
  Object.values(chatSubscriptions).forEach(sub=>{ try{ sb.removeChannel(sub); }catch(e){} });
  Object.keys(chatSubscriptions).forEach(k=>delete chatSubscriptions[k]);
  // Reset in-memory state
  state.userId=null; state.profileName=''; state.profileEmail=''; state.profileId=null;
  state.specialBadges=[]; state.myCard=null; state.friends=[]; state.editingProfile=false;
  state.view='browse'; state.rsvps={}; state.chats={}; myTickets=[];
  destroyMainMap(); destroyHostMap();
  document.getElementById('app').style.display='none';
  document.getElementById('nav-container').innerHTML=''; document.getElementById('view-container').innerHTML='';
  renderGate();
}
// Back-compat alias — older call sites referenced resetProfile by name.
function resetProfile(confirmed){ return signOut(confirmed); }

let navStack = [];
function pushNav(){ navStack.push({view:state.view, selectedEventId:state.selectedEventId}); }
function goBack(){
  if(navStack.length>0){
    const p=navStack.pop();
    state.view=p.view; state.selectedEventId=p.selectedEventId;
    renderNav(); renderView();
    if(state.view!=='browse') window.scrollTo({top:0,behavior:'smooth'});
  } else { goBrowse(); }
}

function goBrowse(){ navStack=[]; state.view='browse'; state.selectedEventId=null; renderNav(); renderView(); }
function setCategory(cat){ state.selectedCategory=cat; renderView(); }
function openEvent(id){ pushNav(); state.view='detail'; state.selectedEventId=id; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); }
function openProfile(){ pushNav(); state.editingProfile=false; state.view='profile'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); }
function openFriends(){ state.view='friends'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); }
function openCalendar(){ pushNav(); state.editingProfile=false; state.view='calendar'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); }
function openHost(){ state.view='host'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); }
function openConnect(id){ pushNav(); state.view='connect'; state.selectedEventId=id; loadConnectData(id).then(()=>{ renderNav(); renderView(); }); }

const chatSubscriptions={};

async function loadConnectData(id){
  // Load attendee cards from Supabase users table
  const attendees=attendeesFor(id);
  const cardsMap={};
  if(attendees.length){
    const {data:cards}=await sb.from('users').select('name,card_theme,card_bio,card_interests,card_fact').in('name',attendees);
    if(cards) cards.forEach(c=>{
      cardsMap[c.name]={theme:c.card_theme||'crimson',bio:c.card_bio||'',interests:c.card_interests||'',fact:c.card_fact||''};
    });
  }
  state.attendeeCards[id]=cardsMap;

  // Load existing chat messages
  const {data:messages}=await sb.from('chat_messages')
    .select('user_name,text,created_at')
    .eq('event_id',id)
    .order('created_at',{ascending:true});
  state.chats[id]=(messages||[]).map(m=>({name:m.user_name,text:m.text,ts:new Date(m.created_at).getTime()}));

  // Subscribe to new messages in real-time (one subscription per event)
  if(!chatSubscriptions[id]){
    chatSubscriptions[id]=sb.channel(`chat:${id}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_messages',filter:`event_id=eq.${id}`},payload=>{
        const msg={name:payload.new.user_name,text:payload.new.text,ts:new Date(payload.new.created_at).getTime()};
        if(!state.chats[id]) state.chats[id]=[];
        // Remove matching optimistic copy (our own send echoed back by realtime)
        const optIdx=state.chats[id].findIndex(m=>m._opt&&m.name===msg.name&&m.text===msg.text);
        if(optIdx!==-1){
          state.chats[id][optIdx]=msg; // silently replace optimistic with confirmed — no re-render needed
        } else {
          state.chats[id].push(msg);
          if(state.view==='connect'&&state.selectedEventId===id){
            _appendChatMsg(msg);           // surgical append — no full re-render flicker
          }
          renderNav();
        }
      })
      .subscribe();
  }
}

function peekAttendee(evId, name){
  const cardsMap=state.attendeeCards[evId]||{};
  const card=cardsMap[name]; const person=personByName(name); const fr=isFriend(name);
  let ca='var(--accent)',cbg='var(--surface)',cborder='var(--line)',ctext='var(--text)',ctextSoft='var(--text-muted)';
  if(card){ const ct=getTheme(card.theme); if(ct){ ca=ct.accent; cbg=ct.bg; cborder=ct.border; ctext=ct.text; ctextSoft=ct.textSoft||ct.text; } }
  const ava=initials(name);
  const bio=card?.bio||(person?.blurb||'');
  const interests=card?.interests?card.interests.split(',').map(s=>s.trim()).filter(Boolean):[];
  const fact=card?.fact||'';
  const tagsHtml=interests.map(t=>`<span class="attendee-full-tag" style="background:${ca}22;border-color:${ca}55;color:${ctext};">${escapeHtml(t)}</span>`).join('');
  let photo='';
  try{ if(name===state.profileName) photo=localStorage.getItem('card_photo:'+name)||''; }catch(e){}
  const avatarHtml=photo
    ?`<div class="attendee-full-ava" style="background:${ca};overflow:hidden;"><img src="${photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/></div>`
    :`<div class="attendee-full-ava" style="background:${ca};">${ava}</div>`;
  const cardHtml=`<div class="attendee-full-card" style="background:${cbg};border:1px solid ${cborder};">
    <div class="attendee-full-card-header">
      ${avatarHtml}
      <div style="flex:1;min-width:0;">
        <div class="attendee-full-name" style="color:${ctext};">${escapeHtml(name)}${fr?' <span style="color:var(--gold);">★</span>':''}</div>
        ${fact?`<div class="attendee-full-sub" style="color:${ctextSoft};">${escapeHtml(fact)}</div>`:''}
      </div>
    </div>
    ${bio?`<div class="attendee-full-bio" style="color:${ctextSoft};">${escapeHtml(bio)}</div>`:''}
    ${tagsHtml?`<div class="attendee-full-tags">${tagsHtml}</div>`:''}
    <div class="attendee-card-wm" style="color:${ca};">${ava}</div>
  </div>`;
  let ov=document.getElementById('attendee-peek-overlay');
  if(!ov){
    ov=document.createElement('div');
    ov.id='attendee-peek-overlay';
    ov.className='attendee-peek-ov';
    ov.innerHTML=`<div class="attendee-peek-sheet"><div class="attendee-peek-handle"></div><div class="attendee-peek-body"><div class="attendee-peek-close-row"><span class="attendee-peek-label">Attendee Profile</span><button class="attendee-peek-close" onclick="closeAttendeePeek()" aria-label="Close">✕</button></div><div id="attendee-peek-content"></div></div></div>`;
    ov.addEventListener('click',e=>{ if(e.target===ov) closeAttendeePeek(); });
    document.body.appendChild(ov);
  }
  document.getElementById('attendee-peek-content').innerHTML=cardHtml;
  requestAnimationFrame(()=>{ ov.classList.add('open'); });
}

function closeAttendeePeek(){
  const ov=document.getElementById('attendee-peek-overlay');
  if(ov) ov.classList.remove('open');
}

function toggleGoingSection(id){
  if(!state.goingOpen) state.goingOpen={};
  state.goingOpen[id]=!state.goingOpen[id];
  renderView();
}

async function uploadNightShot(evId,input){
  const file=input.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=async function(e){
    const raw=e.target.result;
    const img=new Image(); img.src=raw;
    await new Promise(r=>{ img.onload=r; });
    const canvas=document.createElement('canvas');
    const maxW=900; const scale=Math.min(1,maxW/img.naturalWidth);
    canvas.width=Math.round(img.naturalWidth*scale);
    canvas.height=Math.round(img.naturalHeight*scale);
    canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
    const compressed=canvas.toDataURL('image/jpeg',0.82);
    localStorage.setItem('night_shot:'+evId,compressed);
    try{ await sb.from('events').update({night_shot_url:compressed}).eq('id',evId); }catch(_){}
    const ev=EVENTS.find(e=>e.id===evId); if(ev) ev.nightShotUrl=compressed;
    renderView();
  };
  reader.readAsDataURL(file);
}

function _buildChatMsgHtml(msg){
  const myCard=state.myCard;
  let _myExt={bgStyle:'obsidian',accentColor:'#CBA43A'};
  try{ const r=localStorage.getItem('card_ext:'+state.profileName); if(r) _myExt={..._myExt,...JSON.parse(r)}; }catch(e){}
  const _myCols=resolveCardColors(_myExt.bgStyle||myCard?.theme||'obsidian',_myExt.accentColor||myCard?.accentColor||'#CBA43A');
  const isOwn=msg.name===state.profileName;
  const nameCol=isOwn?_myCols.accent:'var(--text-muted)';
  return `<div class="msg-row ${isOwn?'own':''}"><div class="msg-col ${isOwn?'own':''}">
    <div class="msg-sender" style="color:${nameCol};">${escapeHtml(msg.name.split(' ')[0])}</div>
    <div class="msg-bubble ${isOwn?'own':'other'}" style="${isOwn?`background:${_myCols.bg};color:${_myCols.text};`:''}">${escapeHtml(msg.text)}</div>
  </div></div>`;
}
function _appendChatMsg(msg){
  const cm=document.getElementById('chat-messages'); if(!cm) return;
  const empty=cm.querySelector('.chat-empty-state'); if(empty) empty.remove();
  const wrap=document.createElement('div');
  wrap.innerHTML=_buildChatMsgHtml(msg);
  const node=wrap.firstElementChild;
  node.classList.add('msg-row-new');
  cm.appendChild(node);
  cm.scrollTo({top:cm.scrollHeight,behavior:'smooth'});
}

async function sendChat(id){
  const input=document.getElementById('chat-input'); const text=input.value.trim();
  if(!text) return;
  input.value='';
  const msg={name:state.profileName,text,ts:Date.now(),_opt:true};
  if(!state.chats[id]) state.chats[id]=[];
  state.chats[id].push(msg);
  _appendChatMsg(msg);
  await sb.from('chat_messages').insert({event_id:id,user_id:state.userId,user_name:state.profileName,text});
}
function handleChatKey(e,id){ if(e.key==='Enter') sendChat(id); }
function getMyEvents(){ return EVENTS.filter(ev=>(state.rsvps[ev.id]||[]).includes(state.profileName)); }
function getMyCategories(){ const s=new Set(); getMyEvents().forEach(ev=>s.add(ev.category)); return s; }
async function redeemBadge(){
  const input=document.getElementById('redeem-input');
  const code=(input?.value||'').trim().toUpperCase();
  if(!code) return;
  const match=SPECIAL_BADGES.find(b=>b.code===code);
  if(!match){ showToast("Code not recognised. Check and try again.",'error'); return; }
  if(state.specialBadges.includes(match.id)){ showToast(`You already have the "${match.name}" badge.`); return; }
  state.specialBadges.push(match.id);
  if(state.userId){
    await sb.from('users').update({special_badges:state.specialBadges}).eq('id',state.userId);
  }
  input.value=''; renderView(); showToast(`Unlocked: ${match.name}`,'success');
}
function getEventDay(ev){ const m=ev.date.match(/(\d{1,2})/); return m?parseInt(m[1],10):null; }
function buildCalendarWeeks(year,monthIdx){
  const firstDay=new Date(year,monthIdx,1); const daysInMonth=new Date(year,monthIdx+1,0).getDate();
  const startOffset=(firstDay.getDay()+6)%7; const cells=[];
  for(let i=0;i<startOffset;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(d);
  while(cells.length%7!==0) cells.push(null);
  const weeks=[]; for(let i=0;i<cells.length;i+=7) weeks.push(cells.slice(i,i+7));
  return weeks;
}

// ---- MAPBOX GL MAP & HTML Markers ----

function buildEventsGeoJSON(){
  return {
    type:'FeatureCollection',
    features: getFilteredEvents()
      .filter(ev=>typeof ev.lon==='number'&&typeof ev.lat==='number'&&isFinite(ev.lon)&&isFinite(ev.lat))
      .map(ev=>({
        type:'Feature',
        geometry:{type:'Point',coordinates:[ev.lon,ev.lat]},
        properties:{id:ev.id,color:CATS[ev.category].color,status:eventStatus(ev),friend:attendeesFor(ev.id).some(isFriend)?1:0,category:ev.category}
      }))
  };
}

let activePopup=null, activePopupEventId=null;
function closeActivePopup(){
  if(activePopup){ try{ activePopup.remove(); }catch(e){} activePopup=null; activePopupEventId=null; }
  document.querySelectorAll('.evpin.open').forEach(el=>el.classList.remove('open'));
}

let htmlMarkerRefs = {};

function updateClusterPaint(){
  if(!lmap||!lmap.getLayer('clusters')) return;
  const dk=state.theme==='dark';
  const c0=dk?'#CBA43A':'#A8841F';
  const c1=dk?'#A8841F':'#7E6210';
  const c2=dk?'#7E6210':'#8A5C0A';
  lmap.setPaintProperty('clusters','circle-color',['step',['get','point_count'],c0,10,c1,30,c2]);
  lmap.setPaintProperty('clusters','circle-stroke-color',dk?'rgba(232,184,75,0.55)':'rgba(255,255,255,0.85)');
}

function attachMapLayers(){
  if(!lmap||lmap.getSource('events')) return;
  lmap.addSource('events',{
    type:'geojson', data:{type:'FeatureCollection',features:[]},
    cluster:true, clusterMaxZoom:13, clusterRadius:42
  });

  // Native Mapbox GL cluster layers — palette matches light/dark via updateClusterPaint()
  lmap.addLayer({
    id:'clusters',
    type:'circle',
    source:'events',
    filter:['has','point_count'],
    paint:{
      'circle-color':['step',['get','point_count'],'#CBA43A',10,'#A8841F',30,'#7E6210'],
      'circle-radius':['step',['get','point_count'],20,10,24,30,28],
      'circle-stroke-width':2,
      'circle-stroke-color':'rgba(255,255,255,0.85)',
      'circle-opacity':0.95
    }
  });
  lmap.addLayer({
    id:'cluster-count',
    type:'symbol',
    source:'events',
    filter:['has','point_count'],
    layout:{
      'text-field':['get','point_count_abbreviated'],
      'text-font':['DIN Offc Pro Bold','Arial Unicode MS Bold'],
      'text-size':12,
      'text-allow-overlap':true
    },
    paint:{'text-color':'#ffffff','text-halo-color':'rgba(0,0,0,0.15)','text-halo-width':1}
  });
  updateClusterPaint();

  // Invisible hitbox for unclustered points (used to show/hide HTML event pins)
  lmap.addLayer({ id:'event-hitbox', type:'circle', source:'events',
    filter:['!',['has','point_count']],
    paint:{'circle-radius':1,'circle-opacity':0}
  });

  // Cluster click → zoom in
  lmap.on('click','clusters',(e)=>{
    const features=lmap.queryRenderedFeatures(e.point,{layers:['clusters']});
    if(!features.length) return;
    lmap.getSource('events').getClusterExpansionZoom(features[0].properties.cluster_id,(err,zoom)=>{
      if(!err) lmap.easeTo({center:features[0].geometry.coordinates,zoom:zoom+0.8});
    });
  });
  lmap.on('mouseenter','clusters',()=>{ lmap.getCanvas().style.cursor='pointer'; });
  lmap.on('mouseleave','clusters',()=>{ lmap.getCanvas().style.cursor=''; });

  lmap.on('click',(e)=>{
    const hits=lmap.queryRenderedFeatures(e.point,{layers:['clusters','event-hitbox']});
    if(!hits.length) closeActivePopup();
  });

  lmap.on('render', syncHtmlMarkers);

  if(state.view==='browse') setTimeout(refreshMarkers, 0);
}

function syncHtmlMarkers(){
  if(!lmap||!lmap.getSource('events')) return;
  // Show/hide HTML event pin markers based on whether the unclustered point is rendered
  const visible = lmap.queryRenderedFeatures({layers:['event-hitbox']});
  const visibleIds = new Set(visible.map(f=>String(f.properties.id)));
  Object.entries(htmlMarkerRefs).forEach(([evId,ref])=>{
    const show=visibleIds.has(evId);
    if(show&&!ref.added){ ref.marker.addTo(lmap); if(ref.bubbleMarker) ref.bubbleMarker.addTo(lmap); ref.added=true; }
    else if(!show&&ref.added){ ref.marker.remove(); if(ref.bubbleMarker) ref.bubbleMarker.remove(); ref.added=false; if(String(activePopupEventId)===evId) closeActivePopup(); }
  });
}

function refreshMarkers(){
  if(!lmap||typeof mapboxgl==='undefined') return;
  const src=lmap.getSource('events');
  if(!src){ lmap.once('load',refreshMarkers); return; }

  Object.values(htmlMarkerRefs).forEach(ref=>{ if(ref.added){ ref.marker.remove(); if(ref.bubbleMarker) ref.bubbleMarker.remove(); } });
  htmlMarkerRefs={};

  
  closeActivePopup();

  const geo=buildEventsGeoJSON();
  src.setData(geo);

  getFilteredEvents().forEach(ev=>{
    const color=CATS[ev.category].color;
    const status=eventStatus(ev);
    const att=attendeesFor(ev.id);
    const friendGoing=att.some(isFriend);

    const el=document.createElement('div');
    el.className='evpin-wrap';
    const hot=isHotEvent(ev);
    const chatOpen=chatIsOpen(ev)&&status!=='past';
    const chatBadge=chatOpen?'<span class="pin-chat"><svg viewBox="0 0 20 20" width="7" height="7" fill="#fff"><path d="M18 2H2C.9 2 0 2.9 0 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg></span>':'';
    el.innerHTML=`<div class="evpin ${status}${hot?' hot':''}" style="--c:${color}">
      ${status==='live'?'<span class="pulse-ring"></span><span class="pulse-ring r2"></span>':''}
      <div class="pin"><span class="pin-dot"></span></div>
      ${friendGoing?'<span class="pin-star">★</span>':''}
      ${chatBadge}
    </div>`;

    // Separate bubble marker — own Mapbox Marker so it never affects the pin's anchor
    let bubbleMarker=null;
    if(status!=='past'&&(hot||chatOpen)){
      const bEl=document.createElement('div');
      bEl.className='pin-bubble-wrap';
      const t=ev.title.length>18?ev.title.slice(0,17)+'…':ev.title;
      const statusHtml=status==='live'
        ?`<div class="pbc-status"><span class="pbc-dot"></span>Live now</div>`
        :chatOpen?`<div class="pbc-status"><span class="pbc-dot"></span>Chat open</div>`:'';
      bEl.innerHTML=`<div class="pin-bubble-card" style="--c:${color}">
        <div class="pbc-title">${escapeHtml(t)}</div>
        ${ev.area?`<div class="pbc-sub">${escapeHtml(ev.area)}</div>`:''}
        ${statusHtml}
      </div>`;
      bubbleMarker=new mapboxgl.Marker({element:bEl,anchor:'bottom',offset:[0,-15]}).setLngLat([ev.lon,ev.lat]);
    }

    const marker=new mapboxgl.Marker({element:el,anchor:'center'}).setLngLat([ev.lon,ev.lat]);

    let closeTimer=null;

    const openPopup=()=>{
      if(activePopupEventId===ev.id) return;
      closeActivePopup();
      const popup=new mapboxgl.Popup({
        offset:{top:[0,8],bottom:[0,-14],left:[14,0],right:[-14,0]},
        closeButton:false, closeOnClick:false, className:'evtip-popup', anchor:'bottom', maxWidth:'240px'
      }).setLngLat([ev.lon,ev.lat]).setHTML(pinTooltipHtml(ev)).addTo(lmap);
      activePopup=popup; activePopupEventId=ev.id;
      el.querySelector('.evpin')?.classList.add('open');
      const popupEl=popup.getElement();
      if(popupEl){
        popupEl.addEventListener('mouseenter',()=>{ clearTimeout(closeTimer); closeTimer=null; });
        popupEl.addEventListener('mouseleave',()=>{ clearTimeout(closeTimer); closeTimer=setTimeout(dismissPopup,150); });
        popupEl.addEventListener('click',e=>{ e.stopPropagation(); closeActivePopup(); openEvent(ev.id); });
        popupEl.addEventListener('touchend',e=>{ e.preventDefault(); e.stopPropagation(); closeActivePopup(); openEvent(ev.id); },{passive:false});
      }
    };

    const dismissPopup=()=>{
      if(activePopupEventId===ev.id){ closeActivePopup(); el.querySelector('.evpin')?.classList.remove('open'); }
    };

    el.addEventListener('mouseenter',()=>{ clearTimeout(closeTimer); closeTimer=null; openPopup(); });
    el.addEventListener('mouseleave',()=>{ clearTimeout(closeTimer); closeTimer=setTimeout(dismissPopup,200); });
    el.addEventListener('click',e=>{
      e.stopPropagation();
      if(activePopupEventId===ev.id){ closeActivePopup(); openEvent(ev.id); } 
      else { openPopup(); }
    });

    htmlMarkerRefs[String(ev.id)]={marker,bubbleMarker,el,added:false};
  });

  if(!lmapFitted&&geo.features.length>0){
    const coords=geo.features.map(f=>f.geometry.coordinates);
    const bounds=coords.reduce((b,c)=>b.extend(c),new mapboxgl.LngLatBounds(coords[0],coords[0]));
    lmap.fitBounds(bounds,{padding:{top:120,bottom:140,left:40,right:40},maxZoom:12});
    lmapFitted=true;
  }
}

function initLeaflet(){
  if(lmap||typeof mapboxgl==='undefined'||!mapboxConfigured()) return;
  const host=document.getElementById('main-map'); if(!host) return;
  mapboxgl.accessToken=MAPBOX_TOKEN;
  lmap=new mapboxgl.Map({
    container:host, style:mapboxStyleUrl(),
    center:[-0.1276,51.5072], zoom:12,
    fadeDuration:300,
    attributionControl:false,
    maxPitch:0, pitch:0, dragPitch:false, touchPitch:false, pitchWithRotate:false
  });
  lmap.addControl(new mapboxgl.NavigationControl({showCompass:true,showZoom:true}),'top-right');
  lmap.on('style.load', () => {
    lmap.setConfigProperty('basemap', 'lightPreset', state.theme === 'dark' ? 'night' : 'day');
    attachMapLayers();
  });
}

function initHostMap(){
  if(hostMap){ hostMap.remove(); hostMap=null; hostMarker=null; }
  const el=document.getElementById('host-map-picker');
  if(!el||typeof mapboxgl==='undefined'||!mapboxConfigured()) return;
  mapboxgl.accessToken=MAPBOX_TOKEN;
  hostMap=new mapboxgl.Map({
    container:el, style:mapboxStyleUrl(),
    center:[newEventLon,newEventLat], zoom:13,
    fadeDuration:300,
    attributionControl:false,
    maxPitch:0, pitch:0, dragPitch:false, touchPitch:false, pitchWithRotate:false
  });
  hostMap.addControl(new mapboxgl.NavigationControl({showCompass:true}),'top-right');
  hostMap.on('style.load', () => {
    hostMap.setConfigProperty('basemap', 'lightPreset', state.theme === 'dark' ? 'night' : 'day');
  });
  const hostEl=document.createElement('div');
  hostEl.className='evpin-wrap';
  hostEl.innerHTML=`<div style="width:22px;height:22px;border-radius:50%;background:var(--accent);border:2.5px solid #fff;box-shadow:0 0 0 1.5px rgba(0,0,0,0.5),0 2px 8px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;"><span style="width:6px;height:6px;border-radius:50%;background:#fff;display:block;"></span></div>`;
  hostMarker=new mapboxgl.Marker({element:hostEl}).setLngLat([newEventLon,newEventLat]).addTo(hostMap);
  hostMap.on('click',function(e){
    newEventLat=e.lngLat.lat; newEventLon=e.lngLat.lng;
    hostMarker.setLngLat([newEventLon,newEventLat]);
    const el=document.getElementById('host-lat-lon-text');
    if(el) el.innerText=`Location Pinned: (${newEventLat.toFixed(4)}, ${newEventLon.toFixed(4)})`;
  });
  setTimeout(()=>hostMap.resize(),50);
}

// ---- ADDRESS SEARCH ----
function generateSessionToken(){
  if(window.crypto&&window.crypto.randomUUID) return window.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{ const r=Math.random()*16|0,v=c==='x'?r:(r&0x3|0x8); return v.toString(16); });
}
let searchSessionToken=generateSessionToken();
let autocompleteTimeout=null;
function handleAddressAutocomplete(){
  const query=(document.getElementById('host-address-search')?.value||'').trim();
  const resultsDiv=document.getElementById('autocomplete-results');
  clearTimeout(autocompleteTimeout);
  if(query.length<3){ resultsDiv.innerHTML=''; resultsDiv.style.display='none'; return; }
  if(!mapboxConfigured()){ resultsDiv.innerHTML=`<div style="padding:10px 16px;font-size:13.5px;color:#E23B3B;">A Mapbox token is required.</div>`; resultsDiv.style.display='block'; return; }
  autocompleteTimeout=setTimeout(async()=>{
    resultsDiv.innerHTML='<div style="padding:10px 16px;font-size:13.5px;color:var(--text-muted);">Searching…</div>';
    resultsDiv.style.display='block';
    try{
      const url=`https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${MAPBOX_TOKEN}&session_token=${searchSessionToken}&country=gb&language=en&limit=6&types=address,poi,place,locality,neighborhood,postcode`;
      const res=await fetch(url);
      if(!res.ok){ let r=`Error (${res.status}).`; if(res.status===401||res.status===403) r='Token rejected.'; else if(res.status===429) r='Rate limit hit.'; resultsDiv.innerHTML=`<div style="padding:10px 16px;font-size:13.5px;color:#E23B3B;">${r}</div>`; return; }
      const data=await res.json();
      if(data&&data.suggestions&&data.suggestions.length>0){
        resultsDiv.innerHTML=data.suggestions.map(s=>{
          const fullAddress=s.full_address||s.place_formatted||s.name;
          const placeText=s.name||fullAddress;
          const mapboxId=(s.mapbox_id||'').replace(/'/g,"\\'");
          return `<div style="padding:10px 14px;cursor:pointer;font-size:13.5px;border-bottom:1px solid var(--line-soft);color:var(--text);" onclick="selectSearchSuggestion('${mapboxId}','${escapeHtml(fullAddress).replace(/'/g,"\\'")}','${escapeHtml(placeText).replace(/'/g,"\\'")}')">
            <div style="font-weight:600;">${escapeHtml(placeText)}</div>
            ${s.place_formatted?`<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${escapeHtml(s.place_formatted)}</div>`:''}
          </div>`;
        }).join('');
      } else { resultsDiv.innerHTML='<div style="padding:10px 14px;font-size:13.5px;color:var(--text-muted);">No matches found</div>'; }
    }catch(e){ resultsDiv.innerHTML=`<div style="padding:10px 14px;font-size:13.5px;color:#E23B3B;">Network error. <button onclick="handleAddressAutocomplete()" style="border:1px solid #E23B3B;background:transparent;color:#E23B3B;border-radius:8px;padding:2px 8px;font-size:11px;cursor:pointer;">Retry</button></div>`; }
  },350);
}
async function selectSearchSuggestion(mapboxId,fullAddress,placeText){
  const resultsDiv=document.getElementById('autocomplete-results');
  document.getElementById('host-address-search').value=fullAddress;
  resultsDiv.innerHTML='<div style="padding:10px 14px;font-size:13.5px;color:var(--text-muted);">Pinpointing…</div>';
  try{
    const res=await fetch(`https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(mapboxId)}?access_token=${MAPBOX_TOKEN}&session_token=${searchSessionToken}`);
    if(!res.ok) throw new Error(`retrieve ${res.status}`);
    const data=await res.json();
    const f=data&&data.features&&data.features[0];
    if(!f) throw new Error('no feature');
    const [lon,lat]=f.geometry.coordinates;
    selectAutocompleteAddress(lat,lon,fullAddress,placeText);
    resultsDiv.style.display='none';
  }catch(e){ resultsDiv.innerHTML=`<div style="padding:10px 14px;font-size:13.5px;color:#E23B3B;">Couldn't pinpoint. <button onclick="handleAddressAutocomplete()" style="border:1px solid #E23B3B;background:transparent;color:#E23B3B;border-radius:8px;padding:2px 8px;cursor:pointer;font-size:11px;">Retry</button></div>`; }
  finally{ searchSessionToken=generateSessionToken(); }
}
function selectAutocompleteAddress(lat,lon,fullAddress,name){
  newEventLat=lat; newEventLon=lon;
  document.getElementById('host-address-search').value=fullAddress;
  document.getElementById('autocomplete-results').style.display='none';
  if(hostMap&&hostMarker){ hostMarker.setLngLat([lon,lat]); hostMap.flyTo({center:[lon,lat],zoom:15}); }
  const el=document.getElementById('host-lat-lon-text');
  if(el) el.innerText=`Location Pinned: (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
  const venueInput=document.getElementById('host-venue');
  if(name&&venueInput&&!venueInput.value&&isNaN(name)) venueInput.value=name.trim();
}

async function submitHostEvent(){
  const title=(document.getElementById('host-title')?.value||'').trim();
  const cat=document.getElementById('host-cat')?.value;
  const startDate=document.getElementById('host-start-date')?.value;
  const startTime=document.getElementById('host-start-time')?.value;
  const endDate=document.getElementById('host-end-date')?.value;
  const endTime=document.getElementById('host-end-time')?.value;
  const startVal=startDate&&startTime?`${startDate}T${startTime}`:'';
  const endVal=endDate&&endTime?`${endDate}T${endTime}`:'';
  const areaName=(document.getElementById('host-area')?.value||'').trim();
  const venue=(document.getElementById('host-venue')?.value||'').trim();
  const capStr=document.getElementById('host-capacity')?.value;
  const priceStr=document.getElementById('host-price')?.value;
  const priceVal=priceStr?parseFloat(priceStr):0;
  const desc=(document.getElementById('host-desc')?.value||'').trim();
  if(!title||!startVal||!endVal||!venue||!capStr){ showToast('Please fill in title, date & time, venue, and capacity.','error'); return; }
  const stDate=new Date(startVal),enDate=new Date(endVal);
  if(stDate>=enDate){ showToast('End time must be after start time.','error'); return; }

  if(_hostType==='public'){
    // Public events don't go live immediately — they queue for owner approval.
    const pubAddress=document.getElementById('host-address-search')?.value||'';
    const pending={
      title, category:cat,
      host_id:state.userId||null, host_name:state.profileName||'', host_email:state.profileEmail||'',
      venue, area:areaName||'London', address:pubAddress,
      lat:newEventLat, lon:newEventLon,
      start_time:stDate.toISOString(), end_time:enDate.toISOString(),
      description:desc, capacity:parseInt(capStr,10), price:priceVal,
      status:'pending', created_at:new Date().toISOString()
    };
    const pbtn=document.getElementById('host-submit-btn');
    if(pbtn){ pbtn.disabled=true; pbtn.textContent='Submitting…'; }
    let saved=false;
    try{ const {error}=await sb.from('pending_events').insert(pending); if(!error) saved=true; }catch(e){}
    if(!saved){
      try{
        const arr=JSON.parse(localStorage.getItem('pending_events_local')||'[]');
        arr.push({...pending, id:'local_'+Date.now()});
        localStorage.setItem('pending_events_local',JSON.stringify(arr));
        saved=true;
      }catch(e){}
    }
    if(pbtn){ pbtn.disabled=false; pbtn.textContent='Submit for review →'; }
    showToast(saved?'Submitted for review — we\'ll approve it shortly.':'Could not submit — please try again.', saved?'success':'error');
    if(saved){ state.view='browse'; renderNav(); renderView(); }
    return;
  }

  const address=document.getElementById('host-address-search')?.value||'';

  const btn=document.getElementById('host-submit-btn');
  if(btn){ btn.disabled=true; btn.textContent='Creating…'; }

  const {data,error}=await sb.from('events').insert({
    title, category:cat,
    host_id:state.userId, host_name:state.profileName,
    venue, area:areaName||'London', address,
    lat:newEventLat, lon:newEventLon,
    start_time:stDate.toISOString(), end_time:enDate.toISOString(),
    description:desc, capacity:parseInt(capStr,10), price:priceVal
  }).select().single();

  if(btn){ btn.disabled=false; btn.textContent='Create private event →'; }
  if(error){ showToast('Failed to create event. Please try again.','error'); console.error(error); return; }

  // Add to local EVENTS array so map updates immediately without a page reload
  const newEvent={
    id:data.id, title:data.title, category:data.category,
    host:data.host_name, hostId:data.host_id,
    venue:data.venue, area:data.area, address:data.address,
    lat:data.lat, lon:data.lon,
    startTime:data.start_time, endTime:data.end_time,
    desc:data.description, capacity:data.capacity, price:priceVal
  };
  computeEventDates(newEvent);
  EVENTS.push(newEvent);

  // Auto-RSVP the host
  await sb.from('rsvps').insert({event_id:data.id,user_id:state.userId,user_name:state.profileName});
  state.rsvps[data.id]=[state.profileName];

  showToast('Event created and pinned to the map!','success');
  openEvent(data.id);
}

function showMapLayer(visible){
  ['main-map','map-filters','map-caption-bar'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.style.display=visible?'':'none';
  });
  const fab=document.getElementById('owner-fin-fab');
  if(fab) fab.style.display=visible&&state.profileEmail==='gondoxml@gmail.com'?'block':'none';
}

// ═══════════════════════════════════════════════════════
// OWNER FINANCIAL DASHBOARD
// ═══════════════════════════════════════════════════════

const OD_PRESETS = {
  Launch:{ev:15,tx:25,pr:12,fep:20,frp:6,fev:5,frv:20,cb:0.3,drop:3,
    ctx:'<strong>Launch:</strong> Solo founder. Tier 1 events (£12 avg). Pre-VAT. Connect Standard — zero per-host fees. 48hr escrow hold is the fraud buffer.',
    cs:{cost:0,l:'Not yet needed'},eng:{cost:0,l:'You are the engineer'}},
  Traction:{ev:80,tx:35,pr:14,fep:120,frp:7,fev:20,frv:35,cb:0.5,drop:3,
    ctx:'<strong>Traction:</strong> ~80 paid events/mo. £14 avg = Tier 1 (£1.50 fee). Monitor VAT threshold. In-app refund UX deflects chargebacks. Private + vetted free events.',
    cs:{cost:1050,l:'Part-time CS (50%)'},eng:{cost:350,l:'Engineer retainer 8 hrs/mo'}},
  Scaling:{ev:350,tx:50,pr:18,fep:500,frp:7,fev:80,frv:40,cb:0.5,drop:3,
    ctx:'<strong>Scaling:</strong> £18 avg = Tier 2 threshold area. Approaching VAT at this volume. Connect Standard saves ~£2/mo per host vs Express.',
    cs:{cost:2100,l:'Full-time CS rep'},eng:{cost:4500,l:'Engineer pt contract 3d/wk'}},
  Dominance:{ev:1500,tx:75,pr:22,fep:2000,frp:7,fev:350,frv:45,cb:0.5,drop:3,
    ctx:'<strong>Dominance:</strong> £22 avg = Tier 2 (£2.50 fee). VAT registered. Post-VAT net ~£1.67/ticket. Stripe revenue share negotiations should begin.',
    cs:{cost:4200,l:'CS team × 2'},eng:{cost:9000,l:'Senior engineer 5d/wk'}},
  CityLeader:{ev:5000,tx:90,pr:22,fep:6000,frp:8,fev:1000,frv:50,cb:0.4,drop:3,
    ctx:'<strong>City Leader:</strong> 450k paid tickets/mo. VAT registered. Enterprise infra deals. Stripe Connect revenue share active.',
    cs:{cost:18000,l:'Head of CS + 4 reps'},eng:{cost:18000,l:'2 full-time engineers'}},
  London1:{ev:12000,tx:100,pr:25,fep:14000,frp:8,fev:2500,frv:55,cb:0.3,drop:3,
    ctx:'<strong>London #1:</strong> 1.2M paid tickets/mo. Tier 2 fee (£2.50). VAT registered. Enterprise agreements across stack. Stripe Connect revenue share at maximum leverage.',
    cs:{cost:45000,l:'CS team of 10 + manager'},eng:{cost:50000,l:'Engineering team of 5'}},
  Custom:{ev:80,tx:35,pr:14,fep:120,frp:7,fev:20,frv:35,cb:0.5,drop:3,
    ctx:'<strong>Custom:</strong> Adjust all inputs manually.',
    cs:{cost:0,l:'Set manually'},eng:{cost:0,l:'Set manually'}}
};
let _odCur = 'Traction';

const _odGbp = v => new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',minimumFractionDigits:0,maximumFractionDigits:0}).format(Math.round(v)||0);
const _odFmt = v => v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'k':Math.round(v).toString();

async function clearAllTestData(confirmed){
  if(!confirmed){
    showConfirm(
      'Wipe all test data?',
      'This deletes every row in users, events, rsvps, tickets, chat_messages, and friends in Supabase. Seed events in the app are unaffected (they\'re hardcoded). Cannot be undone.',
      'Wipe everything',
      'clearAllTestData'
    );
    return;
  }
  showToast('Wiping…','info');
  try{
    await Promise.all([
      sb.from('chat_messages').delete().not('id','is',null),
      sb.from('rsvps').delete().not('id','is',null),
      sb.from('tickets').delete().not('id','is',null),
      sb.from('friends').delete().not('id','is',null),
    ]);
    await sb.from('events').delete().not('id','is',null);
    await sb.from('users').delete().not('id','is',null);
    showToast('All test data wiped. Signing out…','success');
    setTimeout(()=>resetProfile(true),1200);
  }catch(err){
    console.error('Wipe failed:',err);
    showToast('Wipe failed — check console','error');
  }
}

// Admin: clear ONLY the users table (all accounts / emails). Events & other
// test data are left intact. Owner-only, test-environment convenience.
async function clearAllUsers(confirmed){
  if(state.profileEmail!=='gondoxml@gmail.com'){ showToast('Owner only','error'); return; }
  if(!confirmed){
    if(!confirm('Delete ALL user accounts (every email) from the users table? Events and other data are kept. This cannot be undone.')) return;
  }
  showToast('Clearing user accounts…','info');
  try{
    const {error}=await sb.from('users').delete().not('id','is',null);
    if(error) throw error;
    showToast('All user accounts cleared. Signing out…','success');
    setTimeout(()=>resetProfile(true),1200);
  }catch(err){
    console.error('Clear users failed:',err);
    showToast('Clear failed — check console','error');
  }
}

function od_tog(id){
  const wrap=document.getElementById('od-wrap'); if(!wrap) return;
  const h=wrap.querySelector('#od-sh-'+id), b=wrap.querySelector('#od-sb-'+id);
  if(!h||!b) return;
  const o=b.classList.contains('open');
  b.classList.toggle('open',!o); h.classList.toggle('open',!o);
}

function _odPlatformFee(pr){
  if(pr<=15) return {fee:1.50,tier:1,label:'Tier 1',badge:'badge-t1'};
  if(pr<=40) return {fee:2.50,tier:2,label:'Tier 2',badge:'badge-t2'};
  if(pr<=71) return {fee:3.50,tier:3,label:'Tier 3',badge:'badge-t3'};
  return {fee:4.50,tier:4,label:'Tier 4',badge:'badge-t4'};
}
function _odVatOnFee(fee,vatReg){ return vatReg?fee/6:0; }
function _odStripeCost(total){ return total*0.015+0.20; }
function _odBarCol(p){ return p<60?'#22C55E':p<85?'#E0B23C':'#E24B4A'; }
function _odTierCls(p){ return p<60?'tbadge tok':p<85?'tbadge twarn':'tbadge tdanger'; }
function _odSetBar(g,id,p){ const el=g(id); if(el){el.style.width=Math.min(p,100)+'%';el.style.background=_odBarCol(Math.min(p,100));} }
function _odSetTier(g,id,l,p){ const el=g(id); if(el){el.className=_odTierCls(Math.min(p,100));el.textContent=l;} }
function _odCalcSupa(r,m){ const o=r>500000||m>50000; return {cost:o?20:0,rp:Math.min(r/500000*100,100),mp:Math.min(m/50000*100,100),over:o}; }
function _odCalcMb(l){ if(l<=50000) return {cost:0,p:l/50000*100,t:'Free'}; return {cost:Math.round((l-50000)/1000*0.4*100)/100,p:100,t:'Paid'}; }
function _odCalcEm(e){ if(e<=3000) return {cost:0,p:e/3000*100,t:'Free'}; if(e<=50000) return {cost:15,p:e/50000*100,t:'Starter'}; return {cost:35,p:e/100000*100,t:'Pro'}; }
function _odCalcVc(i){ if(i<=1e6) return {cost:0,p:i/1e6*100,t:'Free'}; return {cost:18,p:100,t:'Pro'}; }

function od_renderStaff(){
  const wrap=document.getElementById('od-wrap'); if(!wrap) return;
  const g=id=>wrap.querySelector('#'+id);
  const st=(id,v)=>{ const el=g(id); if(el) el.textContent=v; };
  const p=OD_PRESETS[_odCur]; const list=g('od-staff-list'); if(!list) return;
  list.innerHTML='';
  [{name:'CS team',data:p.cs},{name:'Engineering',data:p.eng}].forEach(r=>{
    const el=document.createElement('div');
    el.style.cssText='display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#1E1F24;border-radius:10px;margin-bottom:6px;';
    const z=r.data.cost===0;
    el.innerHTML='<div><div style="font-size:12px;font-weight:500;color:#C5C6CB">'+r.name+'</div><div style="font-size:10px;color:#5F5E5A;margin-top:2px">'+r.data.l+'</div></div><div><div style="font-family:\'SF Mono\',monospace;font-size:13px;font-weight:600;color:'+(z?'#5F5E5A':'#E24B4A')+'">'+_odGbp(r.data.cost)+'/mo</div></div>';
    list.appendChild(el);
  });
  const tot=p.cs.cost+p.eng.cost;
  st('od-staff-total',_odGbp(tot)); st('od-shv-staff',_odGbp(tot)+'/mo');
}

function od_recalc(){
  const wrap=document.getElementById('od-wrap'); if(!wrap) return;
  const g=id=>wrap.querySelector('#'+id);
  const gv=id=>{ const el=g(id); return el?Number(el.value):0; };
  const st=(id,v)=>{ const el=g(id); if(el) el.textContent=v; };

  const ev=gv('od-sl-ev'),tx=gv('od-sl-tx'),pr=gv('od-sl-pr');
  const fep=gv('od-sl-fe-p'),frp=gv('od-sl-fr-p'),fev=gv('od-sl-fe-v'),frv=gv('od-sl-fr-v');
  const cbRate=gv('od-sl-cb')/100, dropRate=gv('od-sl-drop')/100;

  st('od-lev',ev.toLocaleString()); st('od-ltx',tx.toLocaleString()); st('od-lpr','£'+pr);
  st('od-lfe-p',fep.toLocaleString()); st('od-lfr-p',Math.min(frp,10));
  st('od-lfe-v',fev.toLocaleString()); st('od-lfr-v',frv);
  st('od-lcb',gv('od-sl-cb').toFixed(1)+'%'); st('od-ldrop',gv('od-sl-drop')+'%');
  st('od-shv-paid',ev.toLocaleString()+' events · £'+pr);

  const {fee,tier,label}=_odPlatformFee(pr);
  const checkoutPrice=pr+fee;
  const stripePerTx=_odStripeCost(checkoutPrice);
  const grossTix=ev*tx;
  const annFeeRev=grossTix*fee*12;
  const vatReg=annFeeRev>=90000;
  const vatPerTix=_odVatOnFee(fee,vatReg);
  const netFeePerTix=fee-vatPerTix-stripePerTx;
  const dropTix=Math.round(grossTix*dropRate);
  const paidTix=Math.max(0,grossTix-dropTix);

  // Tier box
  ['t1','t2','t3','t4'].forEach((t,i)=>{
    const el=g('od-tbr-'+t); if(el) el.className='tb-row'+(tier===i+1?' active':'');
  });
  st('od-tb-tiern',tier);
  st('od-tb-host','£'+pr.toFixed(2));
  const elFee=g('od-tb-fee'); if(elFee) elFee.textContent='£'+fee.toFixed(2);
  const elStr=g('od-tb-stripe'); if(elStr) elStr.textContent='-£'+stripePerTx.toFixed(2);
  const elVat=g('od-tb-vat'); if(elVat) elVat.textContent=vatReg?('-£'+vatPerTix.toFixed(2)):'£0.00 (pre-threshold)';
  st('od-tb-checkout','£'+checkoutPrice.toFixed(2));
  const elNet=g('od-tb-net'); if(elNet){ elNet.textContent=(netFeePerTix<0?'-':'')+'£'+Math.abs(netFeePerTix).toFixed(2); elNet.style.color=netFeePerTix<0.20?'#E24B4A':netFeePerTix<0.50?'#E0B23C':'#22C55E'; }

  st('od-st-ptx',_odFmt(paidTix)); st('od-st-fee','£'+fee.toFixed(2)); st('od-st-checkout','£'+checkoutPrice.toFixed(2));

  // Revenue
  const grossFeeRev=paidTix*fee;
  const totalVat=paidTix*vatPerTix;
  const netFeeRev=grossFeeRev-totalVat;
  const totalStripe=paidTix*stripePerTx;
  const cbCount=Math.round(paidTix*cbRate);
  const cbCost=cbCount*15;
  const gp=netFeeRev-totalStripe-cbCost;

  st('od-pl-pf',_odGbp(grossFeeRev));
  const pfNote=g('od-pf-note'); if(pfNote) pfNote.textContent=_odFmt(paidTix)+' tickets × £'+fee.toFixed(2)+' ('+label+')';
  const plVat=g('od-pl-vat'); if(plVat){ plVat.textContent=vatReg?('-'+_odGbp(totalVat)):'£0'; plVat.className='plv '+(vatReg?'rd':'dim'); }
  const vatNote=g('od-vat-note'); if(vatNote) vatNote.textContent=vatReg?('Registered · annualised £'+Math.round(annFeeRev/1000)+'k > £90k threshold'):'Pre-threshold · annualised £'+Math.round(annFeeRev/1000)+'k / £90k';
  st('od-pl-netrev',_odGbp(netFeeRev));
  const plStr=g('od-pl-str'); if(plStr){ plStr.textContent='-'+_odGbp(totalStripe); plStr.className='plv str'; }
  const strNote=g('od-str-note'); if(strNote) strNote.textContent='1.5%+20p on £'+checkoutPrice.toFixed(2)+' × '+_odFmt(paidTix)+' txns';
  const plCb=g('od-pl-cb'); if(plCb){ plCb.textContent=cbCount>0?('-'+_odGbp(cbCost)):'£0'; plCb.className='plv '+(cbCount>0?'rd':'dim'); }
  const cbNote=g('od-cb-note'); if(cbNote) cbNote.textContent=cbCount>0?(cbCount+' disputes × £15'):('No disputes modelled');
  st('od-pl-gp',_odGbp(gp));

  // Infra
  const privRsvp=fep*Math.min(frp,10), vetRsvp=fev*frv, totalFree=privRsvp+vetRsvp;
  const totalLoad=paidTix+totalFree;
  const freeRatio=totalLoad>0?totalFree/totalLoad:0;
  st('od-total-free',_odFmt(totalFree));
  st('od-load-ratio',Math.round(freeRatio*100)+'% free');
  const lb=g('od-load-bar'); if(lb){ lb.style.width=Math.min(freeRatio*100,100)+'%'; lb.style.background=_odBarCol(Math.min(freeRatio/0.6*100,100)); }
  st('od-shv-free',_odFmt(totalFree)+' free RSVPs/mo');

  const dbRows=totalLoad*5, maus=Math.round(totalLoad*0.6), mapLoads=paidTix*2, emails=totalLoad*1.5, inv=totalLoad*8;
  const sb=_odCalcSupa(dbRows,maus), mb=_odCalcMb(mapLoads), em=_odCalcEm(emails), vc=_odCalcVc(inv);
  _odSetBar(g,'od-sb-b',sb.rp); _odSetTier(g,'od-sb-t',sb.over?'Over free':sb.rp>60?'Near limit':'Free',sb.rp); st('od-sb-n',_odFmt(dbRows));
  const sbC=g('od-sb-c'); if(sbC){ sbC.textContent='£'+sb.cost; sbC.className='uc '+(sb.cost>0?'bad':'ok'); }
  _odSetBar(g,'od-mau-b',sb.mp); _odSetTier(g,'od-mau-t',sb.over?'Over free':sb.mp>60?'Near limit':'Free',sb.mp); st('od-mau-n',_odFmt(maus)+' MAUs');
  _odSetBar(g,'od-mb-b',mb.p); _odSetTier(g,'od-mb-t',mb.t,mb.p); st('od-mb-n',_odFmt(mapLoads));
  const mbC=g('od-mb-c'); if(mbC){ mbC.textContent='£'+Math.round(mb.cost); mbC.className='uc '+(mb.cost>0?'bad':'ok'); }
  _odSetBar(g,'od-em-b',em.p); _odSetTier(g,'od-em-t',em.t,em.p); st('od-em-n',_odFmt(emails));
  const emC=g('od-em-c'); if(emC){ emC.textContent='£'+em.cost; emC.className='uc '+(em.cost>0?'bad':'ok'); }
  _odSetBar(g,'od-vc-b',vc.p); _odSetTier(g,'od-vc-t',vc.t,vc.p); st('od-vc-n',_odFmt(inv));
  const vcC=g('od-vc-c'); if(vcC){ vcC.textContent='£'+vc.cost; vcC.className='uc '+(vc.cost>0?'bad':'ok'); }
  const totalInfra=sb.cost+Math.round(mb.cost)+em.cost+vc.cost;
  st('od-infra-tot','£'+totalInfra.toLocaleString()); st('od-shv-infra','£'+totalInfra+'/mo');
  const plSb=g('od-pl-sb'); if(plSb){ plSb.textContent=sb.cost>0?'-£'+sb.cost:'£0'; plSb.className='plv '+(sb.cost>0?'am':'dim'); }
  const sbPl=g('od-sb-pl'); if(sbPl) sbPl.textContent=sb.cost>0?'Pro':'Free';
  const plMb=g('od-pl-mb'); if(plMb){ plMb.textContent=mb.cost>0?'-£'+Math.round(mb.cost):'£0'; plMb.className='plv '+(mb.cost>0?'am':'dim'); }
  const mbPl=g('od-mb-pl'); if(mbPl) mbPl.textContent=mb.t;
  const plEm=g('od-pl-em'); if(plEm){ plEm.textContent=em.cost>0?'-£'+em.cost:'£0'; plEm.className='plv '+(em.cost>0?'am':'dim'); }
  const emPl=g('od-em-pl'); if(emPl) emPl.textContent=em.t;
  const plVc=g('od-pl-vc'); if(plVc){ plVc.textContent=vc.cost>0?'-£'+vc.cost:'£0'; plVc.className='plv '+(vc.cost>0?'am':'dim'); }
  const vcPl=g('od-vc-pl'); if(vcPl) vcPl.textContent=vc.t;

  // Staffing
  const p=OD_PRESETS[_odCur];
  const csC=p.cs.cost, engC=p.eng.cost, totalStaff=csC+engC, totalOpex=totalInfra+totalStaff;
  const plCs=g('od-pl-cs'); if(plCs){ plCs.textContent=csC>0?'-'+_odGbp(csC):'£0'; plCs.className='plv '+(csC>0?'pu':'dim'); }
  const csN=g('od-cs-n'); if(csN) csN.textContent=p.cs.l;
  const plEng=g('od-pl-eng'); if(plEng){ plEng.textContent=engC>0?'-'+_odGbp(engC):'£0'; plEng.className='plv '+(engC>0?'pu':'dim'); }
  const engN=g('od-eng-n'); if(engN) engN.textContent=p.eng.l;
  st('od-pl-opex','-'+_odGbp(totalOpex));

  // Tax + founder draw
  const pre=gp-totalOpex, ann=pre*12, tr=pre>0?(ann>50000?0.25:0.19):0, tax=pre>0?pre*tr:0, netAfterTax=pre-tax;
  const DRAW_TARGET=10000, DRAW_CAP=20000;
  let actualDraw, drawLabel, reinvest;
  if(netAfterTax<=0){ actualDraw=0; drawLabel='Business not yet profitable'; reinvest=0; }
  else if(netAfterTax<DRAW_TARGET){ actualDraw=netAfterTax; drawLabel='Below £10k — taking all profit as draw'; reinvest=0; }
  else if(netAfterTax<DRAW_CAP){ actualDraw=DRAW_TARGET; drawLabel='£10k/mo draw · surplus reinvested'; reinvest=netAfterTax-actualDraw; }
  else { actualDraw=DRAW_CAP; drawLabel='£20k/mo hard cap reached · everything above reinvests'; reinvest=netAfterTax-actualDraw; }

  st('od-pl-pre',_odGbp(pre));
  const taxL=g('od-tax-l'); if(taxL) taxL.textContent='UK corp tax · '+(tr*100)+'% effective rate';
  st('od-pl-tax','-'+_odGbp(tax));
  const plDraw=g('od-pl-draw'); if(plDraw) plDraw.textContent=actualDraw>0?('-'+_odGbp(actualDraw)):'£0';
  const drawNote=g('od-draw-note'); if(drawNote) drawNote.textContent=drawLabel;
  const drawDisplay=g('od-draw-display'); if(drawDisplay) drawDisplay.textContent=_odGbp(actualDraw)+'/mo';
  const neEl=g('od-pl-net'); if(neEl){ neEl.textContent=_odGbp(reinvest); neEl.className='od-thv '+(reinvest>0?'pos':netAfterTax<=0?'neg':'pos'); }

  // Status pills
  const pillTier=g('od-pill-tier'); if(pillTier){ pillTier.textContent=label+' · £'+fee.toFixed(2)+'/ticket'; pillTier.className='status-pill '+(tier===1?'sp-blue':tier===2?'sp-green':tier===3?'sp-amber':'sp-purple'); }
  const pillVat=g('od-pill-vat'); if(pillVat){ pillVat.textContent=vatReg?'VAT Registered':'Pre-VAT (£'+Math.round(annFeeRev/1000)+'k/£90k)'; pillVat.className='status-pill '+(vatReg?'sp-red':'sp-green'); }
  const pillStripe=g('od-pill-stripe'); if(pillStripe){ pillStripe.textContent='Stripe · £'+stripePerTx.toFixed(2)+'/txn'; pillStripe.className='status-pill sp-blue'; }
  const pillNet=g('od-pill-net'); if(pillNet){ pillNet.textContent='Net £'+netFeePerTix.toFixed(2)+'/ticket'; pillNet.className='status-pill '+(netFeePerTix<0.20?'sp-red':netFeePerTix<0.60?'sp-amber':'sp-green'); }

  // Vetting highlight
  ['od-vc1','od-vc2','od-vc3','od-vc4'].forEach(id=>{ const el=g(id); if(el) el.className='vet-card'; });
  if(pr<20){ const el=g('od-vc1'); if(el) el.className='vet-card active'; }
  else if(pr<50){ const el=g('od-vc2'); if(el) el.className='vet-card active'; }
  else { const el=g('od-vc3'); if(el) el.className='vet-card active'; }

  // Alerts
  const stripePct=netFeeRev>0?totalStripe/netFeeRev*100:0;
  const aVat=g('od-alert-vat'); if(aVat) aVat.className='pitfall-alert '+(vatReg?'info show':'');
  const aCb=g('od-alert-cb'); if(aCb) aCb.className='pitfall-alert '+(cbCost>500?'warn show':'');
  const aStr=g('od-alert-stripe'); if(aStr) aStr.className='pitfall-alert '+(stripePct>40?'warn show':'');
  const aMar=g('od-alert-margin'); if(aMar) aMar.className='pitfall-alert '+(pre<0?'danger show':'');
  const aRat=g('od-alert-ratio'); if(aRat) aRat.className='pitfall-alert '+(freeRatio>0.6?'warn show':'');

  // Risk list
  const risks=[
    {n:'Net margin per ticket',d:'After Stripe + VAT (ex-infra/staff)',v:'£'+netFeePerTix.toFixed(2),cls:netFeePerTix<0.20?'bad':netFeePerTix<0.50?'warn':'ok',note:netFeePerTix<0.20?'Below safety floor':'Healthy'},
    {n:'VAT status',d:vatReg?'Registered · 20% absorbed from fee':'Pre-threshold — build reserves',v:vatReg?_odGbp(totalVat)+'/mo withheld':'Pre-VAT',cls:vatReg?'warn':'ok',note:vatReg?'Checkout price unchanged':'Cross £90k annualised fee revenue to trigger'},
    {n:'Stripe fee drag',d:'Processing as % of net fee revenue',v:Math.round(stripePct)+'%',cls:stripePct>40?'bad':stripePct>25?'warn':'ok',note:stripePct>40?'Raise ticket price to Tier 2 range':'Acceptable'},
    {n:'Chargeback exposure',d:cbCount+' disputes · £15 each',v:_odGbp(cbCost)+'/mo',cls:cbCost>2000?'bad':cbCost>500?'warn':'ok',note:'In-app refund UX deflects most'},
    {n:'Free load ratio',d:Math.round(freeRatio*100)+'% of RSVPs are free',v:Math.round(freeRatio*100)+'%',cls:freeRatio>0.8?'bad':freeRatio>0.6?'warn':'ok',note:'Private cap (10) + vetting keeps this manageable'},
    {n:'Staffing vs gross profit',d:'Staff cost as % of gross profit',v:gp>0?Math.round(totalStaff/gp*100)+'%':'N/A',cls:gp>0&&totalStaff>gp?'bad':gp>0&&totalStaff/gp>0.6?'warn':'ok',note:'Hire too early = margin squeeze'},
  ];
  const rl=g('od-risk-list'); if(!rl) return;
  rl.innerHTML=''; let score=0;
  risks.forEach(r=>{
    if(r.cls==='bad') score+=2; else if(r.cls==='warn') score+=1;
    const el=document.createElement('div'); el.className='risk-row';
    el.innerHTML='<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:500;color:#C5C6CB">'+r.n+'</div><div style="font-size:10px;color:#5F5E5A;margin-top:2px">'+r.d+'</div><div style="font-size:10px;color:#5B9FD9;margin-top:2px">'+r.note+'</div></div><div style="text-align:right;flex-shrink:0;margin-left:8px"><div class="rc '+r.cls+'">'+r.v+'</div></div>';
    rl.appendChild(el);
  });
  st('od-shv-risks',score===0?'All clear':score<=2?'Low risk':score<=4?'Watch':score<=6?'High risk':'Critical');
  st('od-shv-risk',gv('od-sl-cb').toFixed(1)+'% CB · '+gv('od-sl-drop')+'% drop');
}

function initOwnerDash(){
  const wrap=document.getElementById('od-wrap'); if(!wrap) return;
  const g=id=>wrap.querySelector('#'+id);
  const sv2=(id,v)=>{ const el=g(id); if(el) el.value=v; };

  ['od-sl-ev','od-sl-tx','od-sl-pr','od-sl-fe-p','od-sl-fr-p','od-sl-fe-v','od-sl-fr-v','od-sl-cb','od-sl-drop'].forEach(id=>{
    const el=g(id); if(!el) return;
    el.addEventListener('input',()=>{
      _odCur='Custom';
      wrap.querySelectorAll('[data-odp]').forEach(b=>{ b.classList.remove('a'); if(b.dataset.odp==='Custom') b.classList.add('a'); });
      const ctx=g('od-ctx'); if(ctx) ctx.innerHTML=OD_PRESETS.Custom.ctx;
      od_renderStaff(); od_recalc();
    });
  });

  const presetsEl=g('od-presets');
  if(presetsEl){
    presetsEl.addEventListener('click',e=>{
      const btn=e.target.closest('[data-odp]'); if(!btn) return;
      const n=btn.dataset.odp; _odCur=n;
      wrap.querySelectorAll('[data-odp]').forEach(b=>{ b.classList.remove('a'); if(b.classList.contains('hype')) b.classList.remove('a'); });
      btn.classList.add('a');
      const p=OD_PRESETS[n];
      sv2('od-sl-ev',p.ev); sv2('od-sl-tx',p.tx); sv2('od-sl-pr',p.pr);
      sv2('od-sl-fe-p',p.fep); sv2('od-sl-fr-p',p.frp); sv2('od-sl-fe-v',p.fev); sv2('od-sl-fr-v',p.frv);
      sv2('od-sl-cb',p.cb); sv2('od-sl-drop',p.drop);
      const ctx=g('od-ctx'); if(ctx) ctx.innerHTML=p.ctx;
      od_renderStaff(); od_recalc();
    });
  }

  const ctx=g('od-ctx'); if(ctx) ctx.innerHTML=OD_PRESETS[_odCur].ctx;
  od_renderStaff(); od_recalc();
  // Kick off live Supabase data load
  loadOwnerLiveData();
}

// ── LIVE FINANCIAL DATA ──────────────────────────────────────────────
let ownerLiveData = null;
let _ownerLiveLoading = false;

async function loadOwnerLiveData(){
  if(_ownerLiveLoading) return;
  _ownerLiveLoading = true;
  const btn = document.getElementById('od-live-refresh');
  if(btn){ btn.textContent='↻ Loading…'; btn.disabled=true; }
  try{
    const [tkRes, evRes, usRes, rvRes] = await Promise.all([
      sb.from('tickets').select('price_per_ticket, total, purchased_at'),
      sb.from('events').select('id, price, start_time'),
      sb.from('users').select('id, created_at'),
      sb.from('rsvps').select('id, created_at'),
    ]);
    const tix   = tkRes.data || [];
    const evs   = evRes.data || [];
    const users = usRes.data || [];
    const rsvps = rvRes.data || [];

    const paid = tix.filter(t=>(t.price_per_ticket||0)>0);
    const free = tix.filter(t=>!((t.price_per_ticket||0)>0));
    const grossRev     = tix.reduce((s,t)=>s+(t.total||0),0);
    const feeRev       = paid.reduce((s,t)=>s+getCumulusFee(t.price_per_ticket||0),0);
    const stripeCosts  = paid.reduce((s,t)=>{
      const fee = getCumulusFee(t.price_per_ticket||0);
      return s + ((t.price_per_ticket||0) + fee)*0.015 + 0.20;
    },0);

    const now = new Date();
    const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const mTix  = tix.filter(t=>t.purchased_at && new Date(t.purchased_at)>=mStart);
    const mPaid = mTix.filter(t=>(t.price_per_ticket||0)>0);
    const mGross   = mTix.reduce((s,t)=>s+(t.total||0),0);
    const mFeeRev  = mPaid.reduce((s,t)=>s+getCumulusFee(t.price_per_ticket||0),0);

    ownerLiveData = {
      totalTickets: tix.length, paidTickets: paid.length, freeTickets: free.length,
      grossRev, feeRev, stripeCosts, netFeeRev: feeRev - stripeCosts,
      totalEvents: evs.length, paidEvents: evs.filter(e=>(e.price||0)>0).length,
      totalUsers: users.length, totalRsvps: rsvps.length,
      mTickets: mTix.length, mGross, mFeeRev,
      updatedAt: new Date(),
    };
    _renderOwnerLivePanel();
  }catch(err){
    console.error('Live data error:',err);
    const p=document.getElementById('od-live-panel');
    if(p) p.querySelector('.od-live-loading').textContent='Could not load data — check console.';
  }finally{
    _ownerLiveLoading=false;
    const btn2=document.getElementById('od-live-refresh');
    if(btn2){ btn2.textContent='↻ Refresh'; btn2.disabled=false; }
  }
}

function _renderOwnerLivePanel(){
  const panel = document.getElementById('od-live-panel');
  if(!panel || !ownerLiveData) return;
  const d = ownerLiveData;
  const fmt = n => n>=1000000?(n/1000000).toFixed(1)+'M':n>=1000?(n/1000).toFixed(1)+'k':String(n);
  const fmtGbp = n => { const abs=Math.abs(n); const s=abs>=1000?'£'+(abs/1000).toFixed(1)+'k':'£'+abs.toFixed(2); return n<0?'-'+s:s; };
  const ts = d.updatedAt.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
  const pct = (a,b) => b>0?(' ('+Math.round(a/b*100)+'%)'):'';

  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--text);">Live Platform Data</div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:1px;">Updated ${ts} · from Supabase</div>
      </div>
      <button id="od-live-refresh" onclick="loadOwnerLiveData()" style="background:var(--surface-2);border:1px solid var(--line);border-radius:8px;padding:6px 12px;font-size:11px;font-weight:600;color:var(--text-muted);cursor:pointer;font-family:var(--font-sans);">↻ Refresh</button>
    </div>

    <div class="od-live-stat-grid">
      <div class="od-live-stat">
        <div class="od-live-stat-label">Tickets Sold</div>
        <div class="od-live-stat-value" style="color:var(--accent);">${fmt(d.totalTickets)}</div>
        <div class="od-live-stat-sub">${d.paidTickets} paid · ${d.freeTickets} free</div>
      </div>
      <div class="od-live-stat">
        <div class="od-live-stat-label">Users</div>
        <div class="od-live-stat-value">${fmt(d.totalUsers)}</div>
        <div class="od-live-stat-sub">registered</div>
      </div>
      <div class="od-live-stat">
        <div class="od-live-stat-label">RSVPs</div>
        <div class="od-live-stat-value">${fmt(d.totalRsvps)}</div>
        <div class="od-live-stat-sub">${d.totalEvents} events</div>
      </div>
    </div>

    <div style="background:var(--surface-2);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-bottom:8px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin-bottom:10px;">Revenue — All Time</div>
      <div class="od-live-rev-row">
        <div><div class="od-live-rev-label">Gross Ticket Revenue</div><div class="od-live-rev-sub">sum of buyer checkout totals</div></div>
        <div class="od-live-rev-val" style="color:var(--text);">${fmtGbp(d.grossRev)}</div>
      </div>
      <div class="od-live-rev-row">
        <div><div class="od-live-rev-label">Cumulus Fee Revenue</div><div class="od-live-rev-sub">${d.paidTickets} paid tickets × tiered fee</div></div>
        <div class="od-live-rev-val" style="color:#22C55E;">${fmtGbp(d.feeRev)}</div>
      </div>
      <div class="od-live-rev-row">
        <div><div class="od-live-rev-label">Stripe Processing Costs</div><div class="od-live-rev-sub">1.5% + 20p per transaction${pct(d.stripeCosts,d.feeRev)}</div></div>
        <div class="od-live-rev-val" style="color:#E24B4A;">-${fmtGbp(d.stripeCosts)}</div>
      </div>
      <div class="od-live-rev-row">
        <div><div class="od-live-rev-label" style="font-weight:700;color:var(--text);">Net Fee Revenue</div><div class="od-live-rev-sub">after processing costs</div></div>
        <div class="od-live-rev-val" style="color:${d.netFeeRev>=0?'#22C55E':'#E24B4A'};font-size:16px;">${fmtGbp(d.netFeeRev)}</div>
      </div>
    </div>

    ${d.mTickets>0||d.mGross>0?`
    <div class="od-live-month">
      <div class="od-live-month-label">This Month</div>
      <div class="od-live-month-stats">
        <div><div class="od-live-mstat-val">${d.mTickets}</div><div class="od-live-mstat-key">tickets</div></div>
        <div><div class="od-live-mstat-val" style="color:#22C55E;">${fmtGbp(d.mFeeRev)}</div><div class="od-live-mstat-key">fee revenue</div></div>
        <div><div class="od-live-mstat-val" style="color:var(--text-soft);">${fmtGbp(d.mGross)}</div><div class="od-live-mstat-key">gross</div></div>
      </div>
    </div>`:`
    <div style="text-align:center;padding:10px;font-size:12px;color:var(--text-muted);">No transactions this month yet</div>`}
  `;
}
// ─────────────────────────────────────────────────────────────────────

function renderOwnerDash(){
  const isOwner = state.profileEmail==='gondoxml@gmail.com';
  if(!isOwner) return `<div class="empty-state" style="padding:40px 20px;text-align:center;"><div style="font-size:32px;margin-bottom:12px;">🔒</div><div style="font-weight:700;margin-bottom:6px;">Restricted</div><div style="color:var(--text-muted);font-size:13px;">Owner access only.</div></div>`;

  const p=OD_PRESETS[_odCur];
  return `
  <button class="back-btn" onclick="goBack()">←</button>
  <div class="connect-header" style="padding-top:8px;">
    <h2>Finances</h2>
    <p>Live data · P&amp;L projections · Risk analysis</p>
  </div>

  <!-- Live Supabase data panel -->
  <div class="od-live-panel" id="od-live-panel">
    <div class="od-live-loading">
      <div style="font-size:13px;color:var(--text-muted);">Loading live data…</div>
      <button id="od-live-refresh" onclick="loadOwnerLiveData()" style="margin-top:8px;background:var(--surface-2);border:1px solid var(--line);border-radius:8px;padding:6px 12px;font-size:11px;font-weight:600;color:var(--text-muted);cursor:pointer;font-family:var(--font-sans);">↻ Refresh</button>
    </div>
  </div>

  <!-- P&L Projection Model -->
  <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:10px;padding:2px 0;">P&amp;L Projection Model</div>
  <div id="od-wrap">
    <div class="pb" id="od-presets">
      <button data-odp="Launch">Launch</button>
      <button data-odp="Traction" class="a">Traction</button>
      <button data-odp="Scaling">Scaling</button>
      <button data-odp="Dominance">Dominance</button>
      <button class="hype" data-odp="CityLeader">City Leader</button>
      <button class="hype" data-odp="London1">London #1</button>
      <button data-odp="Custom">Custom</button>
    </div>
    <div class="ctx" id="od-ctx"></div>

    <div class="status-bar">
      <div class="status-pill sp-blue" id="od-pill-tier">—</div>
      <div class="status-pill sp-green" id="od-pill-vat">Pre-VAT</div>
      <div class="status-pill sp-blue" id="od-pill-stripe">Stripe</div>
      <div class="status-pill sp-green" id="od-pill-net">—</div>
    </div>

    <div class="pitfall-alert info" id="od-alert-vat">ℹ VAT threshold crossed — 20% absorbed from platform fee. Checkout price unchanged. Net margin per ticket reduces.</div>
    <div class="pitfall-alert warn" id="od-alert-cb">⚠ Chargeback fees exceeding £500/mo — ensure in-app refund UX is prominent to deflect bank disputes.</div>
    <div class="pitfall-alert warn" id="od-alert-stripe">⚠ Stripe fees over 40% of fee revenue — consider raising average ticket price above £15 to unlock Tier 2.</div>
    <div class="pitfall-alert danger" id="od-alert-margin">⚠ Pre-tax margin negative — costs outpacing revenue. Review staffing timing.</div>
    <div class="pitfall-alert warn" id="od-alert-ratio">⚠ Free event load above 60% of total RSVPs — tighten vetted organiser criteria.</div>

    <!-- PAID EVENTS -->
    <div class="section-h open" id="od-sh-paid" onclick="od_tog('paid')">
      <span class="sh-t"><span class="od-dot" style="background:#5B9FD9"></span> Paid events</span>
      <span style="display:flex;align-items:center;gap:8px"><span class="sh-v" id="od-shv-paid">—</span><span class="sh-arr">▾</span></span>
    </div>
    <div class="section-b open" id="od-sb-paid">
      <div class="od-card">
        <div class="od-sr"><div class="od-st"><span>Monthly paid events</span><span class="od-vb" id="od-lev">—</span></div><input type="range" id="od-sl-ev" min="1" max="10000" step="1" value="${p.ev}"></div>
        <div class="od-sr"><div class="od-st"><span>Avg. tickets per event</span><span class="od-vb" id="od-ltx">—</span></div><input type="range" id="od-sl-tx" min="5" max="500" step="1" value="${p.tx}"></div>
        <div class="od-sr"><div class="od-st"><span>Avg. ticket price (host cut)</span><span class="od-vb" id="od-lpr">—</span></div><input type="range" id="od-sl-pr" min="1" max="200" step="1" value="${p.pr}"></div>
        <div class="tier-box">
          <div class="tb-row" id="od-tbr-t1"><span class="tb-label">£0–£15 <span class="tb-badge badge-t1">Tier 1</span></span><span class="tb-val" style="color:#5B9FD9">£1.50 fee</span></div>
          <div class="tb-row" id="od-tbr-t2"><span class="tb-label">£16–£40 <span class="tb-badge badge-t2">Tier 2</span></span><span class="tb-val" style="color:#22C55E">£2.50 fee</span></div>
          <div class="tb-row" id="od-tbr-t3"><span class="tb-label">£41–£71 <span class="tb-badge badge-t3">Tier 3</span></span><span class="tb-val" style="color:#E0B23C">£3.50 fee</span></div>
          <div class="tb-row" id="od-tbr-t4"><span class="tb-label">£72+ <span class="tb-badge badge-t4">Tier 4</span></span><span class="tb-val" style="color:#AFA9EC">£4.50 fee</span></div>
          <div class="tb-div"></div>
          <div class="tb-row"><span class="tb-label">Host sets price</span><span class="tb-val" id="od-tb-host">—</span></div>
          <div class="tb-row"><span class="tb-label">Cumulus fee (Tier <span id="od-tb-tiern">—</span>)</span><span class="tb-val" style="color:#22C55E" id="od-tb-fee">—</span></div>
          <div class="tb-row"><span class="tb-label">Stripe on total (1.5%+20p)</span><span class="tb-val" style="color:#E24B4A" id="od-tb-stripe">—</span></div>
          <div class="tb-row"><span class="tb-label">VAT from fee (if >£90k/yr)</span><span class="tb-val" style="color:#E24B4A" id="od-tb-vat">—</span></div>
          <div class="tb-div"></div>
          <div class="tb-total"><span style="color:#C5C6CB">Attendee pays</span><span style="color:#F1F1EF" id="od-tb-checkout">—</span></div>
          <div class="tb-total" style="margin-top:4px"><span style="color:#C5C6CB">Cumulus nets/ticket</span><span id="od-tb-net" style="color:#22C55E">—</span></div>
        </div>
      </div>
    </div>

    <!-- FREE EVENTS -->
    <div class="section-h" id="od-sh-free" onclick="od_tog('free')" style="margin-top:4px">
      <span class="sh-t"><span class="od-dot" style="background:#D4537E"></span> Free events</span>
      <span style="display:flex;align-items:center;gap:8px"><span class="sh-v" id="od-shv-free">—</span><span class="sh-arr">▾</span></span>
    </div>
    <div class="section-b" id="od-sb-free">
      <div class="od-card">
        <div class="od-sr"><div class="od-st"><span>Private events/mo (friends, cap 10)</span><span class="od-vp" id="od-lfe-p">—</span></div><input type="range" id="od-sl-fe-p" min="0" max="5000" step="1" value="${p.fep}"></div>
        <div class="od-sr"><div class="od-st"><span>Avg. RSVPs (max 10)</span><span class="od-vp" id="od-lfr-p">—</span></div><input type="range" id="od-sl-fr-p" min="2" max="10" step="1" value="${p.frp}"></div>
        <div style="height:1px;background:#2A2B32;margin:8px 0"></div>
        <div class="od-sr"><div class="od-st"><span>Vetted organiser free events/mo</span><span class="od-vp" id="od-lfe-v">—</span></div><input type="range" id="od-sl-fe-v" min="0" max="3000" step="1" value="${p.fev}"></div>
        <div class="od-sr"><div class="od-st"><span>Avg. RSVPs per vetted event</span><span class="od-vp" id="od-lfr-v">—</span></div><input type="range" id="od-sl-fr-v" min="5" max="200" step="1" value="${p.frv}"></div>
        <div style="margin-top:10px;padding:10px 12px;background:#1E1F24;border-radius:10px;">
          <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:5px"><span style="color:#868C96">Total free RSVPs/mo</span><span style="font-family:'SF Mono',monospace;color:#D4537E" id="od-total-free">—</span></div>
          <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:5px"><span style="color:#868C96">Free vs total load</span><span style="font-family:'SF Mono',monospace" id="od-load-ratio">—</span></div>
          <div style="height:5px;background:#0F1117;border-radius:3px;overflow:hidden"><div id="od-load-bar" style="height:100%;border-radius:3px;background:#D4537E;width:0%"></div></div>
          <div style="font-size:10px;color:#5F5E5A;margin-top:5px">Private events capped at 10 RSVPs · vetted requires 3 successful paid events</div>
        </div>
      </div>
    </div>

    <!-- HOST VETTING -->
    <div class="section-h" id="od-sh-vet" onclick="od_tog('vet')" style="margin-top:4px">
      <span class="sh-t"><span class="od-dot" style="background:#E0B23C"></span> Host vetting tiers</span>
      <span style="display:flex;align-items:center;gap:8px"><span class="sh-v" id="od-shv-vet">Active</span><span class="sh-arr">▾</span></span>
    </div>
    <div class="section-b" id="od-sb-vet">
      <div class="od-card">
        <div style="font-size:11px;color:#868C96;margin-bottom:8px;line-height:1.5">Vetting scales with financial risk. Graduated hosts (3+ paid events, zero disputes) bypass all gates.</div>
        <div class="vetting-grid">
          <div class="vet-card" id="od-vc1"><div class="vc-tier" style="color:#5B9FD9">Tier 1 · Under £20</div><div class="vc-rule">Instant publish. 48hr escrow hold is security buffer.</div></div>
          <div class="vet-card" id="od-vc2"><div class="vc-tier" style="color:#22C55E">Tier 2 · £20–£49</div><div class="vc-rule">Requires social graph verification or community website.</div></div>
          <div class="vet-card" id="od-vc3"><div class="vc-tier" style="color:#E0B23C">Tier 3 · £50+</div><div class="vc-rule">Queue pause. Host submits justification or venue docs. 4hr review target.</div></div>
          <div class="vet-card" id="od-vc4"><div class="vc-tier" style="color:#AFA9EC">Graduated</div><div class="vc-rule">3 successful paid events, zero dispute flags — all gates removed permanently.</div></div>
        </div>
      </div>
    </div>

    <!-- RISK INPUTS -->
    <div class="section-h" id="od-sh-risk" onclick="od_tog('risk')" style="margin-top:4px">
      <span class="sh-t"><span class="od-dot" style="background:#E24B4A"></span> Risk inputs</span>
      <span style="display:flex;align-items:center;gap:8px"><span class="sh-v" id="od-shv-risk">—</span><span class="sh-arr">▾</span></span>
    </div>
    <div class="section-b" id="od-sb-risk">
      <div class="od-card">
        <div class="od-sr"><div class="od-st"><span>Chargeback rate (% paid tickets)</span><span class="od-vr" id="od-lcb">—</span></div><input type="range" id="od-sl-cb" min="0" max="2" step="0.1" value="${p.cb}"></div>
        <div style="font-size:10px;color:#5F5E5A;margin-top:-4px;margin-bottom:10px">CNP industry avg 0.6–1.0% · in-app refund UX deflects to ~0.3–0.5% · £15 fee per dispute</div>
        <div class="od-sr"><div class="od-st"><span>Fee drop-off at checkout (%)</span><span class="od-vr" id="od-ldrop">—</span></div><input type="range" id="od-sl-drop" min="0" max="20" step="1" value="${p.drop}"></div>
        <div style="font-size:10px;color:#5F5E5A;margin-top:-4px">Tickets lost due to visible fee — lower with DICE-style upfront pricing (3% realistic)</div>
      </div>
    </div>

    <!-- STAFFING -->
    <div class="section-h" id="od-sh-staff" onclick="od_tog('staff')" style="margin-top:4px">
      <span class="sh-t"><span class="od-dot" style="background:#7F77DD"></span> Staffing</span>
      <span style="display:flex;align-items:center;gap:8px"><span class="sh-v" id="od-shv-staff">—</span><span class="sh-arr">▾</span></span>
    </div>
    <div class="section-b" id="od-sb-staff">
      <div class="od-card">
        <div id="od-staff-list"></div>
        <div style="margin-top:10px;padding:9px 12px;background:#1E1F24;border-radius:10px;display:flex;justify-content:space-between">
          <span style="font-size:12px;color:#868C96">Total team staffing/mo</span>
          <span style="font-family:'SF Mono',monospace;font-size:14px;font-weight:600;color:#7F77DD" id="od-staff-total">£0</span>
        </div>
        <div style="height:1px;background:#2A2B32;margin:12px 0"></div>
        <div class="od-lbl"><span class="od-dot" style="background:#22C55E"></span> Founder draw (automatic)</div>
        <div class="founder-box">
          <div class="founder-row"><span>Below £10k profit</span><span style="font-family:'SF Mono',monospace;color:#C5C6CB">Take all of it</span></div>
          <div class="founder-row"><span>£10k – £20k profit</span><span style="font-family:'SF Mono',monospace;color:#22C55E">Draw £10k · rest reinvests</span></div>
          <div class="founder-row" style="margin-bottom:0"><span>Above £20k profit</span><span style="font-family:'SF Mono',monospace;color:#22C55E">Hard cap £20k · rest reinvests</span></div>
        </div>
      </div>
    </div>

    <!-- P&L -->
    <div style="margin-top:10px">
      <div class="od-card">
        <div class="od-stats3">
          <div class="od-sc"><div class="od-sl">Paid tickets</div><div class="od-sv bl" id="od-st-ptx">—</div></div>
          <div class="od-sc"><div class="od-sl">Platform fee</div><div class="od-sv gn" id="od-st-fee">—</div></div>
          <div class="od-sc"><div class="od-sl">Buyer pays</div><div class="od-sv" id="od-st-checkout" style="color:#F1F1EF">—</div></div>
        </div>

        <div class="od-stag">Revenue</div>
        <div class="plr"><div class="pll">Platform fees collected<small id="od-pf-note">—</small></div><div class="plv gn" id="od-pl-pf">—</div></div>
        <div class="plr"><div class="pll">UK VAT withheld (if applicable)<small id="od-vat-note">—</small></div><div class="plv rd" id="od-pl-vat">—</div></div>
        <div class="plr"><div class="pll s">Net fee revenue (ex-VAT)</div><div class="plv" id="od-pl-netrev">—</div></div>

        <div class="od-div"></div>
        <div class="od-stag">Payment costs (Connect Standard)</div>
        <div class="plr"><div class="pll">Stripe processing (1.5% + 20p)<small id="od-str-note">—</small></div><div class="plv str" id="od-pl-str">—</div></div>
        <div class="plr"><div class="pll">Chargebacks<small id="od-cb-note">—</small></div><div class="plv rd" id="od-pl-cb">—</div></div>
        <div class="plr"><div class="pll s">Gross profit after payments</div><div class="plv" id="od-pl-gp">—</div></div>

        <div class="od-div"></div>
        <div class="od-stag">Infrastructure</div>
        <div class="plr"><div class="pll">Supabase<small id="od-sb-pl">—</small></div><div class="plv am" id="od-pl-sb">£0</div></div>
        <div class="plr"><div class="pll">Mapbox<small id="od-mb-pl">—</small></div><div class="plv am" id="od-pl-mb">£0</div></div>
        <div class="plr"><div class="pll">Resend<small id="od-em-pl">—</small></div><div class="plv am" id="od-pl-em">£0</div></div>
        <div class="plr"><div class="pll">Vercel<small id="od-vc-pl">—</small></div><div class="plv am" id="od-pl-vc">£0</div></div>

        <div class="od-div"></div>
        <div class="od-stag">Staffing</div>
        <div class="plr"><div class="pll">CS team<small id="od-cs-n">—</small></div><div class="plv pu" id="od-pl-cs">—</div></div>
        <div class="plr"><div class="pll">Engineering<small id="od-eng-n">—</small></div><div class="plv pu" id="od-pl-eng">—</div></div>

        <div class="od-div"></div>
        <div class="plr"><div class="pll s">Total OpEx</div><div class="plv am" id="od-pl-opex">—</div></div>
        <div class="plr"><div class="pll s">Pre-tax net margin</div><div class="plv" id="od-pl-pre">—</div></div>
        <div class="plr"><div class="pll">UK corp tax<small id="od-tax-l">—</small></div><div class="plv rd" id="od-pl-tax">—</div></div>
        <div class="plr"><div class="pll">Founder draw<small id="od-draw-note">—</small></div><div class="plv gn" id="od-pl-draw">—</div></div>

        <div class="od-th">
          <div><div class="od-t1">Reinvestment pool</div><div class="od-t2">Profit returned to business after your draw</div></div>
          <div style="text-align:right">
            <div class="od-thv pos" id="od-pl-net">—</div>
            <div style="font-size:11px;margin-top:4px;font-family:'SF Mono',monospace;color:#868C96">your draw: <span id="od-draw-display" style="color:#22C55E">—</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- PITFALL ANALYSIS -->
    <div class="section-h" id="od-sh-risks" onclick="od_tog('risks')" style="margin-top:10px">
      <span class="sh-t"><span class="od-dot" style="background:#E24B4A"></span> Pitfall analysis</span>
      <span style="display:flex;align-items:center;gap:8px"><span class="sh-v" id="od-shv-risks">—</span><span class="sh-arr">▾</span></span>
    </div>
    <div class="section-b" id="od-sb-risks">
      <div class="od-card" style="margin-top:4px"><div id="od-risk-list"></div></div>
    </div>

    <!-- INFRASTRUCTURE -->
    <div class="section-h" id="od-sh-infra" onclick="od_tog('infra')" style="margin-top:4px">
      <span class="sh-t"><span class="od-dot" style="background:#1D9E75"></span> Infrastructure headroom</span>
      <span style="display:flex;align-items:center;gap:8px"><span class="sh-v" id="od-shv-infra">—</span><span class="sh-arr">▾</span></span>
    </div>
    <div class="section-b" id="od-sb-infra">
      <div class="od-card" style="margin-top:4px">
        <div class="ibar-row">
          <div class="ibar-top"><span class="ibar-name">Supabase rows <span class="tbadge tok" id="od-sb-t">Free</span></span><span class="ibar-nums" id="od-sb-n">—</span></div>
          <div class="ibar-track"><div class="ibar-fill" id="od-sb-b" style="width:0%"></div></div>
          <div class="ibar-det"><span>Free 500k → Pro £20</span><span class="uc ok" id="od-sb-c">£0</span></div>
        </div>
        <div class="ibar-row">
          <div class="ibar-top"><span class="ibar-name">Supabase MAUs <span class="tbadge tok" id="od-mau-t">Free</span></span><span class="ibar-nums" id="od-mau-n">—</span></div>
          <div class="ibar-track"><div class="ibar-fill" id="od-mau-b" style="width:0%"></div></div>
          <div class="ibar-det"><span>Free 50k → Pro 100k</span><span class="uc ok" id="od-mau-c">incl.</span></div>
        </div>
        <div class="ibar-row">
          <div class="ibar-top"><span class="ibar-name">Mapbox <span class="tbadge tok" id="od-mb-t">Free</span></span><span class="ibar-nums" id="od-mb-n">—</span></div>
          <div class="ibar-track"><div class="ibar-fill" id="od-mb-b" style="width:0%"></div></div>
          <div class="ibar-det"><span>Free 50k → £0.40/1k</span><span class="uc ok" id="od-mb-c">£0</span></div>
        </div>
        <div class="ibar-row">
          <div class="ibar-top"><span class="ibar-name">Resend <span class="tbadge tok" id="od-em-t">Free</span></span><span class="ibar-nums" id="od-em-n">—</span></div>
          <div class="ibar-track"><div class="ibar-fill" id="od-em-b" style="width:0%"></div></div>
          <div class="ibar-det"><span>Free 3k → Starter £15 → Pro £35</span><span class="uc ok" id="od-em-c">£0</span></div>
        </div>
        <div class="ibar-row">
          <div class="ibar-top"><span class="ibar-name">Vercel <span class="tbadge tok" id="od-vc-t">Free</span></span><span class="ibar-nums" id="od-vc-n">—</span></div>
          <div class="ibar-track"><div class="ibar-fill" id="od-vc-b" style="width:0%"></div></div>
          <div class="ibar-det"><span>Free 1M → Pro £18</span><span class="uc ok" id="od-vc-c">£0</span></div>
        </div>
        <div style="margin-top:10px;padding:9px 12px;background:#1E1F24;border-radius:10px;display:flex;justify-content:space-between">
          <span style="font-size:12px;color:#868C96">Total infra/mo</span>
          <span style="font-family:'SF Mono',monospace;font-size:13px;font-weight:600;color:#F1F1EF" id="od-infra-tot">£0</span>
        </div>
      </div>
    </div>

    <!-- DEV TOOLS -->
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #2A2B32;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#5F5E5A;margin-bottom:10px;">Developer tools</div>
      <button onclick="clearAllTestData()" style="width:100%;padding:11px;background:transparent;border:1px solid #E24B4A44;border-radius:10px;color:#E24B4A;font-size:12px;font-weight:600;cursor:pointer;font-family:-apple-system,sans-serif;letter-spacing:0.01em;">🗑 Wipe all Supabase test data &amp; sign out</button>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════
// HOST PAYOUTS PANEL
// ═══════════════════════════════════════════════════════
function renderHostPayoutsPanel(){
  // Host-facing only. The per-ticket platform fee schedule is company-internal
  // (see the owner Finances dashboard) and is deliberately NOT shown here.
  return `
  <div class="hp-panel">
    <div class="hp-title">💸 Your payouts explained</div>
    <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;line-height:1.6;">You set the ticket price and <strong style="color:var(--text);">keep 100% of it</strong> — always. Buyers pay a small platform fee at checkout that covers card processing and running Cumulus. It's added on top of your price, so it never comes out of your earnings.</div>
    <div class="hp-tier-row">
      <span class="hp-tier-label">Your ticket price</span>
      <span class="hp-tier-fee" style="color:#22C55E">You keep 100%</span>
    </div>
    <div class="hp-tier-row">
      <span class="hp-tier-label">Platform fee</span>
      <span class="hp-tier-fee" style="color:var(--text-muted)">Added at checkout · paid by the buyer</span>
    </div>
    <div style="margin-top:12px;padding:10px 12px;background:var(--surface-2);border-radius:10px;font-size:11px;color:var(--text-muted);line-height:1.6;">
      <strong style="color:var(--text);">Payout timeline:</strong> Funds are held in escrow until 48 hours after your event ends, then released directly to your Stripe account. Graduated hosts (3+ events, zero disputes) get all friction removed.
    </div>
  </div>`;
}

function openOwnerDash(){ pushNav(); state.view='owner-dash'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); }

/* ══════════════════════════════════════════════════
   HOST REVIEW — admin only
   ══════════════════════════════════════════════════ */
function openReview(){ pushNav(); state.view='review'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); }

function renderReview(){
  const container=document.getElementById('view-container');
  container.innerHTML=`
    <button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header">
      <h2>Host Review</h2>
      <p>Applications to host public events on Cumulus</p>
    </div>
    <div id="review-content">
      <div class="review-empty">
        <div class="review-empty-icon">📋</div>
        <div>Loading applications…</div>
      </div>
    </div>`;
  setTimeout(loadAndRenderReview, 0);
}

async function loadAndRenderReview(){
  const content=document.getElementById('review-content');
  if(!content) return;

  let apps=[];
  // Supabase
  try{
    const {data,error}=await sb.from('host_applications').select('*').order('created_at',{ascending:false});
    if(!error&&data) apps=[...apps,...data];
  }catch(e){}
  // localStorage fallback
  try{
    const local=JSON.parse(localStorage.getItem('host_applications_local')||'[]');
    // Deduplicate by email+created_at
    const existingKeys=new Set(apps.map(a=>a.email+'|'+a.created_at));
    apps=[...apps,...local.filter(a=>!existingKeys.has(a.email+'|'+a.created_at))];
  }catch(e){}

  if(!apps.length){
    content.innerHTML=`<div class="review-empty"><div class="review-empty-icon">✅</div><div style="font-weight:700;margin-bottom:4px;">All clear</div><div>No host applications yet.</div></div>`;
    return;
  }

  const pending=apps.filter(a=>a.status==='pending');
  const reviewed=apps.filter(a=>a.status!=='pending');

  content.innerHTML=`
    ${pending.length?`<div class="review-section-hd">Pending (${pending.length})</div>${pending.map(_buildReviewCard).join('')}`:''}
    ${reviewed.length?`<div class="review-section-hd" style="margin-top:${pending.length?'20px':'0'};">Reviewed (${reviewed.length})</div>${reviewed.map(_buildReviewCard).join('')}`:''}
  `;
}

function _buildReviewCard(app){
  const date=app.created_at?new Date(app.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'';
  const isPending=app.status==='pending';
  const id=escapeHtml(app.id||app.email);
  const email=escapeHtml(app.email);
  return `<div class="review-card list-item-stagger">
    <div class="review-card-top">
      <div>
        <div class="review-card-name">${escapeHtml(app.name)}</div>
        <div class="review-card-email">${email}</div>
      </div>
      <span class="review-status-badge ${app.status}">${app.status}</span>
    </div>
    ${app.business_name?`<div class="review-detail"><div class="review-detail-lbl">Venue / Business</div><div class="review-detail-val">${escapeHtml(app.business_name)}</div></div>`:''}
    ${app.event_types?`<div class="review-detail"><div class="review-detail-lbl">Event types</div><div class="review-detail-val">${escapeHtml(app.event_types)}</div></div>`:''}
    ${app.description?`<div class="review-detail"><div class="review-detail-lbl">About their events</div><div class="review-detail-val">${escapeHtml(app.description)}</div></div>`:''}
    ${app.why_host?`<div class="review-detail"><div class="review-detail-lbl">Why they want to host</div><div class="review-detail-val">${escapeHtml(app.why_host)}</div></div>`:''}
    ${date?`<div style="font-size:10px;color:var(--text-muted);margin-top:8px;">Applied ${date}</div>`:''}
    ${isPending?`<div class="review-actions">
      <button class="btn btn-small review-approve-btn" style="flex:1;" onclick="reviewHost('${id}','${email}','approved')">Approve</button>
      <button class="btn btn-outline btn-small review-reject-btn"  style="flex:1;" onclick="reviewHost('${id}','${email}','rejected')">Reject</button>
    </div>`:''}
  </div>`;
}

async function reviewHost(appId, email, decision){
  // Update Supabase
  try{ await sb.from('host_applications').update({status:decision}).eq('id',appId); }catch(e){}
  // Update localStorage fallback
  try{
    let apps=JSON.parse(localStorage.getItem('host_applications_local')||'[]');
    apps=apps.map(a=>(a.email===email||a.id===appId)?{...a,status:decision}:a);
    localStorage.setItem('host_applications_local',JSON.stringify(apps));
  }catch(e){}
  // If approved: add verified-host badge to the user
  if(decision==='approved'){
    try{
      const {data:u}=await sb.from('users').select('id,special_badges').eq('email',email).single();
      if(u){
        const badges=[...(u.special_badges||[])];
        if(!badges.includes('verified-host')) badges.push('verified-host');
        await sb.from('users').update({special_badges:badges}).eq('id',u.id);
      }
    }catch(e){}
  }
  showToast(decision==='approved'?`${email} approved as host`:`Application rejected`,'success');
  await loadAndRenderReview();
}

/* ══════════════════════════════════════════════════
   EVENT APPROVALS — admin only. Public events submitted by hosts
   queue here for review before they are published to the map.
   ══════════════════════════════════════════════════ */
function openEventApprovals(){ pushNav(); state.view='event-approvals'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); }

function renderEventApprovals(){
  const container=document.getElementById('view-container');
  container.innerHTML=`
    <button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header">
      <h2>Event Approvals</h2>
      <p>Public events awaiting review before they go live</p>
    </div>
    <div id="evapp-content">
      <div class="review-empty"><div class="review-empty-icon">📋</div><div>Loading events…</div></div>
    </div>`;
  setTimeout(loadAndRenderEventApprovals,0);
}

function _pendingEventKey(e){ return e.id!=null ? String(e.id) : (e.title||'')+'|'+(e.created_at||''); }

async function loadAndRenderEventApprovals(){
  const content=document.getElementById('evapp-content');
  if(!content) return;
  let evs=[];
  try{
    const {data,error}=await sb.from('pending_events').select('*').order('created_at',{ascending:false});
    if(!error&&data) evs=[...evs,...data];
  }catch(e){}
  try{
    const local=JSON.parse(localStorage.getItem('pending_events_local')||'[]');
    const keys=new Set(evs.map(_pendingEventKey));
    evs=[...evs,...local.filter(e=>!keys.has(_pendingEventKey(e)))];
  }catch(e){}

  if(!evs.length){
    content.innerHTML=`<div class="review-empty"><div class="review-empty-icon">✅</div><div style="font-weight:700;margin-bottom:4px;">All clear</div><div>No public events awaiting approval.</div></div>`;
    return;
  }
  const pending=evs.filter(e=>e.status==='pending');
  const reviewed=evs.filter(e=>e.status!=='pending');
  content.innerHTML=`
    ${pending.length?`<div class="review-section-hd">Pending (${pending.length})</div>${pending.map(_buildEventApprovalCard).join('')}`:''}
    ${reviewed.length?`<div class="review-section-hd" style="margin-top:${pending.length?'20px':'0'};">Reviewed (${reviewed.length})</div>${reviewed.map(_buildEventApprovalCard).join('')}`:''}`;
}

function _buildEventApprovalCard(ev){
  const id=escapeHtml(String(ev.id!=null?ev.id:''));
  const when=ev.start_time?new Date(ev.start_time).toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'';
  const isPending=ev.status==='pending';
  const priceLbl=Number(ev.price)>0?`£${Number(ev.price).toFixed(2)}`:'Free';
  return `<div class="review-card list-item-stagger">
    <div class="review-card-top">
      <div>
        <div class="review-card-name">${escapeHtml(ev.title||'Untitled event')}</div>
        <div class="review-card-email">${escapeHtml(ev.host_name||'Unknown host')}${ev.host_email?' · '+escapeHtml(ev.host_email):''}</div>
      </div>
      <span class="review-status-badge ${escapeHtml(ev.status||'pending')}">${escapeHtml(ev.status||'pending')}</span>
    </div>
    ${ev.category?`<div class="review-detail"><div class="review-detail-lbl">Category</div><div class="review-detail-val">${escapeHtml(ev.category)}</div></div>`:''}
    ${when?`<div class="review-detail"><div class="review-detail-lbl">When</div><div class="review-detail-val">${when}</div></div>`:''}
    ${ev.venue?`<div class="review-detail"><div class="review-detail-lbl">Venue</div><div class="review-detail-val">${escapeHtml(ev.venue)}${ev.area?', '+escapeHtml(ev.area):''}</div></div>`:''}
    <div class="review-detail"><div class="review-detail-lbl">Capacity · Ticket price</div><div class="review-detail-val">${ev.capacity!=null?escapeHtml(String(ev.capacity)):'—'} · ${priceLbl}</div></div>
    ${ev.description?`<div class="review-detail"><div class="review-detail-lbl">Description</div><div class="review-detail-val">${escapeHtml(ev.description)}</div></div>`:''}
    ${isPending?`<div class="review-actions">
      <button class="btn btn-small review-approve-btn" style="flex:1;" onclick="decideEvent('${id}','approved')">Approve &amp; publish</button>
      <button class="btn btn-outline btn-small review-reject-btn" style="flex:1;" onclick="decideEvent('${id}','rejected')">Reject</button>
    </div>`:''}
  </div>`;
}

async function decideEvent(pendingId, decision){
  // Locate the pending record — Supabase first, then the local fallback store.
  let rec=null;
  try{ const {data}=await sb.from('pending_events').select('*').eq('id',pendingId).single(); rec=data; }catch(e){}
  if(!rec){
    try{ const arr=JSON.parse(localStorage.getItem('pending_events_local')||'[]'); rec=arr.find(e=>String(e.id)===String(pendingId))||null; }catch(e){}
  }
  if(decision==='approved' && rec) await _publishApprovedEvent(rec);
  // Record the decision (both stores, whichever exists)
  try{ await sb.from('pending_events').update({status:decision}).eq('id',pendingId); }catch(e){}
  try{
    let arr=JSON.parse(localStorage.getItem('pending_events_local')||'[]');
    arr=arr.map(e=>String(e.id)===String(pendingId)?{...e,status:decision}:e);
    localStorage.setItem('pending_events_local',JSON.stringify(arr));
  }catch(e){}
  showToast(decision==='approved'?'Event approved & published':'Event rejected','success');
  await loadAndRenderEventApprovals();
}

async function _publishApprovedEvent(rec){
  let inserted=null;
  try{
    const {data,error}=await sb.from('events').insert({
      title:rec.title, category:rec.category,
      host_id:rec.host_id, host_name:rec.host_name,
      venue:rec.venue, area:rec.area||'London', address:rec.address||'',
      lat:rec.lat, lon:rec.lon,
      start_time:rec.start_time, end_time:rec.end_time,
      description:rec.description, capacity:rec.capacity, price:rec.price||0
    }).select().single();
    if(!error) inserted=data;
  }catch(e){}
  const src=inserted||rec;
  const newEvent={
    id: inserted?inserted.id : ('local_ev_'+Date.now()),
    title:src.title, category:src.category,
    host:src.host_name, hostId:src.host_id,
    venue:src.venue, area:src.area||'London', address:src.address||'',
    lat:src.lat, lon:src.lon,
    startTime:src.start_time, endTime:src.end_time,
    desc:src.description, capacity:src.capacity, price:src.price||0
  };
  computeEventDates(newEvent);
  if(!EVENTS.some(e=>String(e.id)===String(newEvent.id))) EVENTS.push(newEvent);
}

function renderView(){
  const app=document.getElementById('app'); const container=document.getElementById('view-container');
  if(state.view!=='host') destroyHostMap();

  if(state.view==='browse'){
    app.classList.add('map-home'); document.body.classList.add('no-scroll');
    container.innerHTML='';
    showMapLayer(true);
    initLeaflet(); refreshFilters(); refreshMarkers();
    setTimeout(()=>{ if(lmap) lmap.resize(); },60);
    return;
  }

  showMapLayer(false);
  app.classList.remove('map-home'); document.body.classList.remove('no-scroll');
  if(state.view==='detail') container.innerHTML=renderDetail(state.selectedEventId);
  else if(state.view==='connect'){container.innerHTML=renderConnect(state.selectedEventId);const _cdEv=EVENTS.find(e=>e.id===state.selectedEventId);if(_cdEv&&!chatIsOpen(_cdEv)&&eventStatus(_cdEv)!=='past')setTimeout(()=>startChatCountdown(_cdEv.id,chatUnlockTime(_cdEv)),0);}
  else if(state.view==='profile') container.innerHTML=renderProfile();
  else if(state.view==='achievements') container.innerHTML=renderAchievements();
  else if(state.view==='friends'){ container.innerHTML=renderSocialTab(); }
  else if(state.view==='calendar') container.innerHTML=renderCalendar();
  else if(state.view==='host'){ container.innerHTML=renderSocialTab(); if(mapboxConfigured()) setTimeout(initHostMap,0); }
  else if(state.view==='book') container.innerHTML=renderBook();
  else if(state.view==='checkout') container.innerHTML=renderCheckout();
  else if(state.view==='confirmed'){ container.innerHTML=renderConfirmed(); setTimeout(afterRenderConfirmed,60); }
  else if(state.view==='my-tickets') container.innerHTML=renderMyTickets();
  else if(state.view==='calendar-day') container.innerHTML=renderCalendarDay();
  else if(state.view==='tickets') container.innerHTML=renderTicketsTab();
  else if(state.view==='social'){ container.innerHTML=renderSocialTab(); }
  else if(state.view==='owner-dash'){ container.innerHTML=renderOwnerDash(); setTimeout(initOwnerDash,0); }
  else if(state.view==='review'){ renderReview(); return; }
  else if(state.view==='event-approvals'){ renderEventApprovals(); return; }
  const cm=document.getElementById('chat-messages'); if(cm) cm.scrollTop=cm.scrollHeight;
}

function getFilteredEvents(){
  const q=(document.getElementById('search-input')?.value||'').toLowerCase();
  let list=EVENTS.filter(ev=>{
    const hasLocation=ev.lat!=null&&ev.lon!=null;
    const mc=state.selectedCategory==='all'||ev.category===state.selectedCategory;
    const mq=!q||(ev.title+ev.venue+ev.area+ev.category+ev.host).toLowerCase().includes(q);
    return hasLocation&&mc&&mq;
  });
  if(state.friendsOnly) list=list.filter(ev=>attendeesFor(ev.id).some(isFriend));
  if(state.liveOnly) list=list.filter(ev=>eventStatus(ev)==='live');
  if(state.hotOnly) list=list.filter(ev=>isHotEvent(ev));
  return list;
}
function toggleLiveOnly(){ state.liveOnly=!state.liveOnly; if(state.liveOnly) state.hotOnly=false; renderView(); }
function toggleHotOnly(){ state.hotOnly=!state.hotOnly; if(state.hotOnly) state.liveOnly=false; renderView(); }
function toggleFriendsOnly(){
  state.friendsOnly=!state.friendsOnly;
  if(state.friendsOnly){ const any=EVENTS.some(ev=>attendeesFor(ev.id).some(isFriend)); if(!any) showToast("No friends going to events yet. Add friends in the Social tab."); }
  renderView();
}
function refreshFilters(){
  const el=document.getElementById('map-filters'); if(!el) return;
  const aa=state.selectedCategory==='all';
  let html=`<button class="mchip ${aa?'active':''}" style="${aa?'background:var(--accent);color:#fff;border-color:transparent;':''}" onclick="setCategory('all')">All</button>`;
  html+=Object.entries(CATS).map(([cat,c])=>{ const a=state.selectedCategory===cat; return `<button class="mchip ${a?'active':''}" style="${a?`background:${c.color};color:#fff;border-color:transparent;`:''}" onclick="setCategory('${cat}')"><span class="mdot" style="background:${c.color}"></span>${cat}</button>`; }).join('');
  html+=`<button class="mchip ${state.friendsOnly?'active':''}" style="${state.friendsOnly?'background:var(--gold);color:#1a1400;border-color:transparent;':''}" onclick="toggleFriendsOnly()"><span class="star">★</span> Friends</button>`;
  html+=`<button class="mchip ${state.liveOnly?'active':''}" style="${state.liveOnly?'background:#E23B3B;color:#fff;border-color:transparent;':''}" onclick="toggleLiveOnly()"><span style="width:6px;height:6px;border-radius:50%;background:${state.liveOnly?'#fff':'#E23B3B'};display:inline-block;margin-right:2px;animation:${state.liveOnly?'blink 1.3s ease-in-out infinite':'none'}"></span>Live</button>`;
  html+=`<button class="mchip ${state.hotOnly?'active':''}" style="${state.hotOnly?'background:#F97316;color:#fff;border-color:transparent;':''}" onclick="toggleHotOnly()">🔥 Hot</button>`;
  el.innerHTML=html;
  // Finances now live in Profile → Admin & Finances (no floating map button)
  const fab=document.getElementById('owner-fin-fab');
  if(fab) fab.innerHTML='';
}

function pinTooltipHtml(ev){
  const status=eventStatus(ev); const c=CATS[ev.category]; const att=attendeesFor(ev.id); const friendsGoing=att.filter(isFriend);
  const statusBadge=status==='live'?`<span class="tip-live"><span class="d"></span>LIVE NOW</span>`:`<span class="tip-up">${status==='past'?'Ended':'Upcoming'}</span>`;
  let goingLine;
  if(att.length===0){ goingLine=`<div class="tip-going none">No one yet — be the first!</div>`; }
  else{ const names=att.slice(0,3).map(n=>isFriend(n)?`<span class="star">★</span> ${escapeHtml(n)}`:escapeHtml(n)); const extra=att.length>3?` +${att.length-3}`:''; goingLine=`<div class="tip-going"><strong>${att.length} going</strong> — ${names.join(', ')}${extra}</div>`; }
  const friendLine=friendsGoing.length?`<div class="tip-friend">★ ${friendsGoing.map(escapeHtml).join(', ')} ${friendsGoing.length>1?'are':'is'} going</div>`:'';
  const capLine=ev.capacity?`<div class="tip-going" style="margin-top:2px;"><strong>${Math.max(0,ev.capacity-att.length)} spaces left</strong></div>`:'';
  return `<div class="evtip-inner" style="--c:${c.color}">
    <div class="tip-top">${statusBadge}<span class="tip-cat" style="background:${c.color}">${ev.category}</span></div>
    <div class="tip-title">${escapeHtml(ev.title)}</div>
    <div class="tip-meta">${ev.date} · ${ev.time}</div>
    <div class="tip-meta">${escapeHtml(ev.venue)}${ev.area?` · ${escapeHtml(ev.area)}`:''}</div>
    ${goingLine}${capLine}${friendLine}
    <div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;justify-content:space-between;font-size:10.5px;font-weight:700;color:${c.color};letter-spacing:0.04em;">
      <span>Open &amp; RSVP</span>
      <span style="font-size:13px;opacity:0.85;">→</span>
    </div>
  </div>`;
}


function renderDetail(id){
  const ev=EVENTS.find(e=>e.id===id);
  if(!ev) return `<div class="empty-state">Event not found.</div>`;
  const c=CATS[ev.category]; const attendees=attendeesFor(id); const status=eventStatus(ev);
  const ticket=getTicketForEvent(id); const price=eventPrice(ev);
  const spacesLeft=ev.capacity?Math.max(0,ev.capacity-attendees.length):null;
  const isFull=spacesLeft!==null&&spacesLeft<=0&&!ticket;
  const statusChip=status==='live'?`<button class="live-chip" style="border:none;background:none;cursor:pointer;padding:0;" onclick="document.getElementById('going-section')?.scrollIntoView({behavior:'smooth'})"><span class="dot"></span>Live now</button>`:`<span class="upcoming-chip">${status==='past'?'Ended':'Upcoming'}</span>`;
  const capBadge=ev.capacity?`<span class="event-badge" style="background:var(--surface-2);color:var(--text);border:1px solid var(--line);margin-left:6px;font-size:10px;">${spacesLeft} spaces left</span>`:'';
  const priceBadge=price?`<span class="event-badge" style="background:var(--surface-2);color:var(--text);border:1px solid var(--line);margin-left:6px;font-size:10px;">From £${price}</span>`:`<span class="event-badge" style="background:#22C55E22;color:#22C55E;border:1px solid #22C55E44;margin-left:6px;font-size:10px;">Free</span>`;
  let bookBtn='';
  if(ticket){
    bookBtn=`<button class="btn" style="background:transparent;border:2px solid #22C55E;color:#22C55E;box-shadow:none;width:100%;" onclick="openViewTicket(${id})">✓ You have a ticket — View it</button>`;
  } else if(isFull){
    bookBtn=`<button class="btn" style="background:var(--surface-2);color:var(--text-muted);cursor:not-allowed;width:100%;">Sold Out</button>`;
  } else {
    bookBtn=`<button class="btn" style="background:${c.color};color:#fff;width:100%;font-size:15px;" onclick="openBook(${id})">${price?`Book Now · From £${price}`:'Register Free'} →</button>`;
  }
  const friendsGoing=attendees.filter(isFriend);
  const going=attendees.includes(state.profileName);
  return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="panel detail-card" style="--corner:${c.color};">
      <div class="detail-hero" style="background-image:url('${catImg(ev.category)}');"></div>
      <span class="event-badge" style="--cat:${c.color};">${ev.category}</span>${statusChip}${capBadge}${priceBadge}
      <h2 class="detail-title">${ev.title}</h2>
      <div style="display:flex;align-items:center;gap:8px;margin:10px 0 6px;flex-wrap:wrap;">
        <span style="font-size:14px;font-weight:700;color:${c.color};">📅 ${ev.date}</span>
        <span style="font-size:13px;font-weight:600;color:var(--text);">· ${ev.time}</span>
      </div>
      <div class="detail-meta-row"><span>${ev.venue}${ev.area?`, ${ev.area}`:''}</span><span>By ${escapeHtml(ev.host)}</span></div>
      <div class="detail-desc">${ev.desc}</div>
      ${bookBtn}
      <div class="attendee-section">
        <h3>${attendees.length} going${ev.capacity?` (Limit ${ev.capacity})`:''}${friendsGoing.length?` · <span class="star">★</span> ${friendsGoing.length} friend${friendsGoing.length>1?'s':''}`:''}</h3>
        <div class="attendee-list">${attendees.length?attendees.map(n=>{ const fr=isFriend(n); return `<div class="attendee-chip ${fr?'friend':''}"><div class="avatar" style="margin-left:0">${initials(n)}</div><span>${fr?'<span class="star">★</span> ':''}${escapeHtml(n)}</span></div>`; }).join(''):`<span style="color:var(--text-muted);font-size:13px;">No bookings yet.</span>`}</div>
      </div>
      ${going?`<div style="margin-top:20px;"><button class="btn" style="background:${c.color};color:#fff;width:100%;" onclick="openConnectGateway(${id})">Open Connect Space →</button></div>`:`<div class="connect-note">Book a ticket to unlock the Connect Space — see who's going and chat before the event.</div>`}
    </div>`;
}

function renderConnect(id){
  const ev=EVENTS.find(e=>e.id===id);
  if(!ev) return `<div class="empty-state">Event not found.</div>`;
  const c=CATS[ev.category]; const attendees=attendeesFor(id); const cardsMap=state.attendeeCards[id]||{}; const chat=state.chats[id]||[]; const myCard=state.myCard;
  let _myExt={motto:'',pattern:'lines',areas:[],accentColor:'#CBA43A',bgStyle:'obsidian'};
  try{ const _r=localStorage.getItem('card_ext:'+state.profileName); if(_r) _myExt={..._myExt,...JSON.parse(_r)}; }catch(e){}
  const _myCols=resolveCardColors(_myExt.bgStyle||myCard?.theme||'obsidian',_myExt.accentColor||myCard?.accentColor||'#CBA43A');
  const _myAccent=_myCols.accent;
  const yourCardHtml=myCard
    ?`<div class="panel intro-card" style="--corner:${_myAccent};background:${_myCols.bg};border-color:${_myAccent}33;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <div class="intro-name" style="color:${_myCols.text};">${escapeHtml(myCard.name)}</div>
        </div>
        ${_myExt.motto?`<div style="font-size:11px;font-style:italic;font-weight:700;color:${_myAccent};margin-bottom:6px;">"${escapeHtml(_myExt.motto)}"</div>`:''}
        ${myCard.bio?`<div class="intro-field-label" style="color:${_myCols.textSoft};">About</div><div class="intro-field-val" style="color:${_myCols.textSoft};">${escapeHtml(myCard.bio)}</div>`:''}
        ${myCard.interests?`<div class="intro-field-label" style="color:${_myCols.textSoft};">Interests</div><div class="interest-tags">${myCard.interests.split(',').map(t=>`<span class="interest-tag" style="border-color:${_myAccent};color:${_myCols.text};">${escapeHtml(t.trim())}</span>`).join('')}</div>`:''}
        <div style="margin-top:12px;"><button class="btn btn-outline btn-small" style="width:100%;border-color:${_myAccent};color:${_myCols.text};" onclick="openCardEditor(null)">Edit your card</button></div>
      </div>`
    :`<div class="panel intro-form"><div style="font-weight:700;font-size:15px;margin-bottom:5px;color:var(--text);">No card yet</div><div style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">Create one and it'll show up here and at every future event automatically.</div><button class="btn btn-small" style="width:100%;" onclick="openCardEditor(${id})">Create your card</button></div>`;
  const others=attendees.filter(n=>n!==state.profileName);
  const goingOpen=!!(state.goingOpen&&state.goingOpen[id]);
  // Preview avatars (collapsed state)
  const previewAvas=others.slice(0,5).map(name=>{
    const card=cardsMap[name]; const ct=card?getTheme(card.theme):null;
    const avaColor=ct?ct.accent:'var(--accent)';
    return `<div class="going-preview-ava" style="background:${avaColor};">${initials(name)}</div>`;
  }).join('');
  // Full grid cards (expanded state)
  const goingGridHtml=others.length?others.map(name=>{
    const card=cardsMap[name]; const fr=isFriend(name); const person=personByName(name);
    const ct=card?getTheme(card.theme):null;
    const avaColor=ct?ct.accent:'var(--accent)';
    const cbg=ct?ct.bg:'var(--surface)'; const cborder=ct?ct.border:'var(--line)';
    const ctext=ct?ct.text:'var(--text)'; const ctextSoft=ct?ct.textSoft:'var(--text-muted)';
    const bioSnippet=card?card.bio:person?person.blurb:'';
    const interests=card&&card.interests?card.interests.split(',').map(s=>s.trim()).filter(Boolean).slice(0,2):[];
    const tagsHtml=interests.map(t=>`<span class="going-card-tag" style="border-color:${avaColor}55;color:${ctext};background:${avaColor}18;">${escapeHtml(t)}</span>`).join('');
    const safeName=escapeHtml(name).replace(/'/g,"\\'");
    return `<div class="going-card" style="background:${cbg};border-color:${cborder};" onclick="peekAttendee(${id},'${safeName}')">
      <div class="going-card-ava" style="background:${avaColor};">${initials(name)}</div>
      <div class="going-card-name" style="color:${ctext};">${escapeHtml(name)}${fr?` <span style="color:var(--gold);font-size:10px;">★</span>`:''}</div>
      ${bioSnippet?`<div class="going-card-bio" style="color:${ctextSoft};">${escapeHtml(bioSnippet)}</div>`:''}
      ${tagsHtml?`<div class="going-card-tags">${tagsHtml}</div>`:''}
    </div>`;
  }).join(''):`<div style="color:var(--text-muted);font-size:13px;padding:12px 0;text-align:center;grid-column:1/-1;">No one else has RSVP'd yet.</div>`;
  const ownTheme=_myCols;
  // Night Shot
  const _nsUrl=ev.nightShotUrl||localStorage.getItem('night_shot:'+id);
  const _isAttendee=attendees.includes(state.profileName);
  const nightShotSection=(eventStatus(ev)==='past'&&_isAttendee)?`
    <div class="section-title" style="color:#FCD34D;">The Night Shot</div>
    <div class="night-shot-panel">
      <div class="night-shot-glow"></div>
      ${_nsUrl
        ?`<div class="night-shot-hd">The memory's in.</div>
           <div class="night-shot-desc">${escapeHtml(ev.title)} · ${ev.date}</div>
           <div class="night-shot-img-frame">
             <img src="${_nsUrl}" class="night-shot-img" alt="Night Shot"/>
             <div class="night-shot-watermark">
               <div class="night-shot-watermark-badge">📸 ${escapeHtml(ev.title)}</div>
               <div class="night-shot-watermark-badge">${ev.date}</div>
             </div>
           </div>`
        :`<div class="night-shot-hd">Drop the Night Shot.</div>
           <div class="night-shot-desc">One photo from the night. The memory lives here — and on every attendee's profile.</div>
           <label class="night-shot-upload-zone">
             <input type="file" accept="image/*" onchange="uploadNightShot(${id},this)"/>
             <div style="font-size:30px;margin-bottom:8px;">📸</div>
             <div style="font-size:14px;font-weight:700;color:#FCD34D;">Upload the Night Shot</div>
             <div style="font-size:11.5px;color:#D4A843;margin-top:5px;opacity:0.85;">One upload, full stop.</div>
           </label>`
      }
    </div>`:'';
  // Chat open countdown
  const daysUntil=Math.ceil((chatUnlockTime(ev)-Date.now())/(24*60*60*1000));
  return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header">
      <span class="event-badge" style="--cat:;">${ev.category}</span>
      <h2>${ev.title}</h2>
      <p style="margin-top:4px;"><span style="font-size:13px;font-weight:600;color:var(--text);">${ev.date} · ${ev.time}</span></p>
      <p>${attendees.length} going · ${escapeHtml(ev.venue)}</p>
    </div>
    <div class="section-title">Your card</div>${yourCardHtml}
    <div class="section-title">Who's going (${others.length})</div>
    <div class="going-section-hdr" id="going-section" onclick="toggleGoingSection(${id})">
      <div style="display:flex;align-items:center;gap:10px;">
        <div class="going-previews">${previewAvas||'<span style="font-size:12px;color:var(--text-muted);">None yet</span>'}</div>
        <span style="font-size:13.5px;font-weight:700;color:var(--text);">${others.length} attendee${others.length!==1?'s':''}</span>
      </div>
      <span style="font-size:13px;font-weight:600;color:var(--accent);">${goingOpen?'Hide ↑':'View all ↓'}</span>
    </div>
    ${goingOpen?`<div class="going-grid">${goingGridHtml}</div>`:''}
    ${nightShotSection}
    <div class="section-title">Group Chat</div>
    ${chatIsOpen(ev)?`<div class="panel chat-box">
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:12px;padding:0 2px;">${attendees.length} member${attendees.length!==1?'s':''} · Chat active for this event</div>
      <div class="chat-messages" id="chat-messages">${chat.length?chat.map(m=>{
        const isOwn=m.name===state.profileName;
        const nameCol=isOwn?_myAccent:'var(--text-muted)';
        return `<div class="msg-row ${isOwn?'own':''}"><div class="msg-col ${isOwn?'own':''}">
          <div class="msg-sender" style="color:${nameCol};">${escapeHtml(m.name.split(' ')[0])}</div>
          <div class="msg-bubble ${isOwn?'own':'other'}" style="${isOwn?`background:${ownTheme.bg};color:${ownTheme.text};`:''}">${escapeHtml(m.text)}</div>
        </div></div>`;
      }).join(''):`<div class="chat-empty-state" style="color:var(--text-muted);font-size:13px;text-align:center;padding:28px 16px;">No messages yet — be the first to say something.</div>`}</div>
      <div class="chat-input-row"><input id="chat-input" class="chat-input" placeholder="Say something to the group…" onkeydown="handleChatKey(event,${id})"/><button class="btn" style="background:${c.color};color:#fff;" onclick="sendChat(${id})">Send</button></div>
    </div>`:`<div class="panel" style="padding:22px 20px;text-align:center;">
      ${eventStatus(ev)==='past'?
        `<div style="font-size:22px;margin-bottom:8px;">🔒</div>
         <div style="font-weight:700;font-size:14px;color:var(--text);margin-bottom:5px;">Chat archived</div>
         <div style="font-size:12.5px;color:var(--text-muted);line-height:1.6;">This event has ended and the chat is now read-only.</div>`
      :
        `<div style="font-size:28px;margin-bottom:8px;">🔒</div>
         <div style="font-weight:700;font-size:15px;color:var(--text);margin-bottom:4px;">Chat opens in</div>
         <div class="chat-countdown-wrap">
           <div class="chat-cd-seg"><span class="chat-cd-num" id="chat-cd-d-${id}">--</span><span class="chat-cd-unit">days</span></div>
           <span class="chat-cd-sep">:</span>
           <div class="chat-cd-seg"><span class="chat-cd-num" id="chat-cd-h-${id}">--</span><span class="chat-cd-unit">hrs</span></div>
           <span class="chat-cd-sep">:</span>
           <div class="chat-cd-seg"><span class="chat-cd-num" id="chat-cd-m-${id}">--</span><span class="chat-cd-unit">min</span></div>
           <span class="chat-cd-sep">:</span>
           <div class="chat-cd-seg"><span class="chat-cd-num" id="chat-cd-s-${id}">--</span><span class="chat-cd-unit">sec</span></div>
         </div>
         <div style="font-size:13px;color:var(--text-muted);line-height:1.6;">The group chat unlocks 7 days before the event so you can meet your fellow attendees beforehand.</div>
         <div class="chat-cd-date">${ev.date} · ${ev.time}</div>`
      }
    </div>`}
  `;
}


async function removeFriend(name){
  state.friends=state.friends.filter(f=>f!==name);
  if(state.userId){
    await sb.from('friends').delete().eq('user_id',state.userId).eq('friend_name',name);
  }
  renderView();
}

let _sheenHandler=null, _sheenMouseHandler=null, _sheenCard=null;

function initCardSheen(){
  const sheen=document.getElementById('card-xl-sheen');
  if(!sheen) return;
  const card=document.querySelector('.cpass-card');
  if(!card) return;
  _sheenCard=card;
  function applySheen(sx,sy){ sheen.style.transform=`translate(${sx}px,${sy}px)`; }
  _sheenHandler=(e)=>{
    const g=Math.max(-50,Math.min(50,e.gamma||0));
    const b=Math.max(-40,Math.min(40,(e.beta||15)-15));
    applySheen((g/50)*65,(b/40)*50);
  };
  _sheenMouseHandler=(e)=>{
    const r=card.getBoundingClientRect();
    const x=((e.clientX-r.left)/r.width-0.5)*2;
    const y=((e.clientY-r.top)/r.height-0.5)*2;
    applySheen(x*65,y*50);
  };
  window.addEventListener('deviceorientation',_sheenHandler);
  card.addEventListener('mousemove',_sheenMouseHandler);
}

// ── Badges: unified list + earned status + chosen "featured" set ──────────
function getAllBadges(){
  const myEvents=getMyEvents(); const myCats=getMyCategories();
  const list=[];
  MILESTONE_BADGES.forEach(b=>list.push({id:b.id,name:b.name,glyph:b.glyph,desc:b.desc,color:b.metal,earned:myEvents.length>=b.need,kind:'Milestone'}));
  CATEGORY_BADGES.forEach(b=>list.push({id:b.id,name:b.name,glyph:b.glyph,desc:b.desc,color:(CATS[b.cat]||{color:'#CBA43A'}).color,earned:myCats.has(b.cat),kind:'Category'}));
  SPECIAL_BADGES.forEach(b=>list.push({id:b.id,name:b.name,glyph:b.glyph,desc:b.desc,color:'#CBA43A',earned:state.specialBadges.includes(b.id),kind:'Special'}));
  return list;
}
function getBadgeById(id){ return getAllBadges().find(b=>b.id===id); }
function getCardExt(){
  let ext={motto:'',pattern:'lines',areas:[],accentColor:'#CBA43A',bgStyle:'obsidian',badges:[]};
  try{ const r=localStorage.getItem('card_ext:'+state.profileName); if(r) ext={...ext,...JSON.parse(r)}; }catch(e){}
  if(!Array.isArray(ext.badges)) ext.badges=[];
  return ext;
}
function saveCardExt(ext){ try{ localStorage.setItem('card_ext:'+state.profileName, JSON.stringify(ext)); }catch(e){} }
// Chosen badges that are actually earned (max 3), in the user's chosen order
function getFeaturedBadges(){
  const ext=getCardExt();
  const all=getAllBadges();
  return ext.badges.map(id=>all.find(b=>b.id===id&&b.earned)).filter(Boolean).slice(0,3);
}

function openExpandedCard(){
  const old=document.getElementById('card-xl-overlay'); if(old) old.remove();
  const card=state.myCard;
  let cardExt={motto:'',pattern:'lines',areas:[],accentColor:'#CBA43A',bgStyle:'obsidian'};
  try{ const r=localStorage.getItem('card_ext:'+state.profileName); if(r) cardExt={...cardExt,...JSON.parse(r)}; }catch(e){}
  let cardPhoto='';
  try{ cardPhoto=localStorage.getItem('card_photo:'+state.profileName)||''; }catch(e){}

  const accent=cardExt.accentColor||card?.accentColor||'#CBA43A';
  const accentAlpha=(a,op)=>{ const m=a.match(/^#([0-9a-f]{6})$/i); if(!m) return `rgba(255,255,255,${op})`; const r2=parseInt(m[1].slice(0,2),16),g2=parseInt(m[1].slice(2,4),16),b2=parseInt(m[1].slice(4,6),16); return `rgba(${r2},${g2},${b2},${op})`; };

  const myEvents=getMyEvents(); const myCats=getMyCategories();
  const earnedTotal=getAllBadges().filter(b=>b.earned).length;
  const lv=getLevel(earnedTotal);

  const uid='CU·'+btoa(state.profileName||'anon').replace(/[^A-Z0-9]/gi,'').substring(0,8).toUpperCase();
  const areas=cardExt.areas&&cardExt.areas.length?cardExt.areas.join(' · '):'';
  const motto=cardExt.motto?`${escapeHtml(cardExt.motto)}`:escapeHtml(card&&card.bio?card.bio:'');
  const initStr=((card?card.name:state.profileName)||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();

  const avatar = cardPhoto
    ? `<div class="cpass-avatar" style="border-color:${accent};"><img src="${cardPhoto}" alt=""/></div>`
    : `<div class="cpass-avatar cpass-avatar-mono" style="border-color:${accentAlpha(accent,0.55)};background:${accentAlpha(accent,0.16)};color:${accent};">${initStr}</div>`;

  // Featured badges — the hero. 3 slots: chosen earned badge, or an "add" placeholder.
  const featured=getFeaturedBadges();
  const slotsHtml=[0,1,2].map(i=>{
    const b=featured[i];
    if(b){
      return `<button class="cpass-badge" onclick="openBadgePicker()" title="${escapeHtml(b.name)}" style="--bc:${b.color};--bcg:${accentAlpha(b.color,0.55)};">
        <span class="cpass-coin"><span class="cpass-coin-shine"></span><span class="cpass-coin-glyph">${b.glyph}</span></span>
        <span class="cpass-badge-name">${escapeHtml(b.name)}</span>
      </button>`;
    }
    return `<button class="cpass-badge cpass-badge-empty" onclick="openBadgePicker()" title="Add a badge">
      <span class="cpass-coin-empty">+</span>
      <span class="cpass-badge-name">Add</span>
    </button>`;
  }).join('');

  const html=`<div class="card-xl-overlay" id="card-xl-overlay" onclick="if(event.target===this)closeExpandedCard()">
    <div class="card-xl-outer">
      <button class="card-xl-close" onclick="closeExpandedCard()" aria-label="Close">✕</button>
      <div class="cpass-card" id="cpass-card" style="--acc:${accent};--acc-glow:${accentAlpha(accent,0.30)};--acc-soft:${accentAlpha(accent,0.14)};">
        <div class="cpass-ambient"></div>

        <!-- Header: wordmark + tier -->
        <div class="cpass-head">
          <div class="cpass-logo">
            <span class="cpass-logo-mark" style="background:${accent};"><svg viewBox="0 0 10 10"><circle cx="5" cy="4" r="2.5"/><ellipse cx="5" cy="7.5" rx="3.5" ry="1.5"/></svg></span>
            <span class="cpass-logo-text">Cumulus</span>
          </div>
          <div class="cpass-tier" style="border-color:${accentAlpha(accent,0.45)};background:${accentAlpha(accent,0.14)};color:${accent};">
            <span class="cpass-tier-dot" style="background:${accent};"></span>${lv.title}
          </div>
        </div>

        <!-- Identity -->
        <div class="cpass-id">
          ${avatar}
          <div class="cpass-id-text">
            <div class="cpass-name">${escapeHtml(card?card.name:state.profileName)}</div>
            <div class="cpass-sub">${motto?escapeHtml(cardExt.motto||(card&&card.bio)||''):'London Community Member'}</div>
          </div>
        </div>

        <!-- FEATURED BADGES — the hero -->
        <div class="cpass-badges-section">
          <div class="cpass-section-head">
            <span class="cpass-section-label">Featured badges</span>
            <button class="cpass-edit" onclick="openBadgePicker()">Edit</button>
          </div>
          <div class="cpass-badges">${slotsHtml}</div>
        </div>

        <!-- Stats -->
        <div class="cpass-stats">
          <div class="cpass-stat"><span class="cpass-stat-num">${myEvents.length}</span><span class="cpass-stat-label">Events</span></div>
          <div class="cpass-stat"><span class="cpass-stat-num">${state.friends.length}</span><span class="cpass-stat-label">Friends</span></div>
          <div class="cpass-stat"><span class="cpass-stat-num">${earnedTotal}</span><span class="cpass-stat-label">Badges</span></div>
        </div>

        <!-- QR to add friend -->
        <div class="cpass-qr-block">
          <div class="cpass-qr-frame">
            <div class="cpass-qr" id="cpass-qr-el"></div>
          </div>
          <div class="cpass-qr-label">Scan to add me on Cumulus</div>
        </div>

        <!-- Footer pass band -->
        <div class="cpass-foot">
          <div>
            <div class="cpass-foot-label">Cumulus Pass</div>
            <div class="cpass-foot-uid">${uid}${areas?` · ${escapeHtml(areas)}`:''}</div>
          </div>
          <div class="cpass-foot-mark" style="background:${accentAlpha(accent,0.20)};color:${accent};">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="10" r="5"/><ellipse cx="12" cy="19" rx="8" ry="4"/></svg>
          </div>
        </div>

        <div class="cpass-sheen" id="card-xl-sheen"></div>
        <div class="cpass-edge" style="background:linear-gradient(90deg,${accentAlpha(accent,0.6)},${accent},${accentAlpha(accent,0.6)});"></div>
      </div>
    </div>
  </div>`;

  document.body.insertAdjacentHTML('beforeend', html);
  requestAnimationFrame(()=>{
    const ov=document.getElementById('card-xl-overlay');
    if(ov) requestAnimationFrame(()=>{
      ov.classList.add('open');
      const qrEl=document.getElementById('cpass-qr-el');
      if(qrEl){
        try{ new QRCode(qrEl,{text:myFriendCode(),width:150,height:150,colorDark:'#0A0A0A',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M}); }
        catch(e){ qrEl.innerHTML=`<div style="font-size:7px;padding:4px;word-break:break-all;color:#000;">${myFriendCode()}</div>`; }
      }
      const sheenCard=document.getElementById('cpass-card');
      if(sheenCard){ window.__cpassCard=sheenCard; }
      initCardSheen();
    });
  });
}

// ── Badge picker — choose up to 3 earned badges to feature on the pass ──────
function openBadgePicker(){
  const old=document.getElementById('cpass-picker-overlay'); if(old) old.remove();
  const ext=getCardExt();
  const chosen=ext.badges.slice(0,3);
  const all=getAllBadges();
  const earned=all.filter(b=>b.earned);
  const locked=all.filter(b=>!b.earned);
  const cell=(b,isChosen,isLocked)=>`
    <button class="bpick-cell${isChosen?' chosen':''}${isLocked?' locked':''}" ${isLocked?'disabled':`onclick="toggleFeaturedBadge('${b.id}')"`} style="--bc:${b.color};">
      <span class="bpick-coin"><span class="bpick-coin-glyph">${b.glyph}</span></span>
      <span class="bpick-name">${escapeHtml(b.name)}</span>
      <span class="bpick-kind">${b.kind}</span>
      ${isChosen?`<span class="bpick-check">✓</span>`:''}
      ${isLocked?`<span class="bpick-lock">🔒</span>`:''}
    </button>`;
  const earnedHtml=earned.length?earned.map(b=>cell(b,chosen.includes(b.id),false)).join(''):`<div class="bpick-empty">No badges yet — RSVP to events to start earning them.</div>`;
  const lockedHtml=locked.map(b=>cell(b,false,true)).join('');
  const html=`<div class="cpass-picker-overlay" id="cpass-picker-overlay" onclick="if(event.target===this)closeBadgePicker()">
    <div class="cpass-picker">
      <div class="bpick-head">
        <div>
          <div class="bpick-title">Featured badges</div>
          <div class="bpick-help" id="bpick-help">Choose up to 3 to show on your pass · <b id="bpick-count">${chosen.length}</b>/3</div>
        </div>
        <button class="bpick-close" onclick="closeBadgePicker()" aria-label="Close">✕</button>
      </div>
      <div class="bpick-scroll">
        <div class="bpick-grid">${earnedHtml}</div>
        ${locked.length?`<div class="bpick-locked-label">Locked</div><div class="bpick-grid">${lockedHtml}</div>`:''}
      </div>
      <button class="btn bpick-done" onclick="closeBadgePicker()">Done</button>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  requestAnimationFrame(()=>{ const ov=document.getElementById('cpass-picker-overlay'); if(ov) requestAnimationFrame(()=>ov.classList.add('open')); });
}
function toggleFeaturedBadge(id){
  const ext=getCardExt();
  let arr=ext.badges.filter(x=>getBadgeById(x)); // prune stale
  const i=arr.indexOf(id);
  if(i>=0){ arr.splice(i,1); }
  else { if(arr.length>=3){ showToast('You can feature up to 3 badges','info'); return; } arr.push(id); }
  ext.badges=arr; saveCardExt(ext);
  // update cells + count without full re-render
  document.querySelectorAll('.bpick-cell').forEach(c=>{});
  const cnt=document.getElementById('bpick-count'); if(cnt) cnt.textContent=arr.length;
  document.querySelectorAll('.bpick-cell').forEach(cell=>{
    const oc=cell.getAttribute('onclick')||''; const m=oc.match(/'([^']+)'/); if(!m) return;
    const chosen=arr.includes(m[1]);
    cell.classList.toggle('chosen',chosen);
    let chk=cell.querySelector('.bpick-check');
    if(chosen&&!chk){ chk=document.createElement('span'); chk.className='bpick-check'; chk.textContent='✓'; cell.appendChild(chk); }
    else if(!chosen&&chk){ chk.remove(); }
  });
}
function closeBadgePicker(){
  const ov=document.getElementById('cpass-picker-overlay');
  if(ov){ ov.classList.remove('open'); setTimeout(()=>ov.remove(),220); }
  // rebuild the pass so featured badges reflect the new choice
  if(document.getElementById('card-xl-overlay')) openExpandedCard();
}

function closeExpandedCard(){
  const ov=document.getElementById('card-xl-overlay');
  if(!ov) return;
  if(_sheenHandler){ window.removeEventListener('deviceorientation',_sheenHandler); _sheenHandler=null; }
  if(_sheenMouseHandler&&_sheenCard){ _sheenCard.removeEventListener('mousemove',_sheenMouseHandler); _sheenMouseHandler=null; _sheenCard=null; }
  ov.classList.remove('open');
  setTimeout(()=>{ if(ov.parentNode) ov.remove(); }, 320);
}

const LOCK_SVG=`<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>`;
function medallionHtml(glyph,color,earned){ const ring=earned?color:'var(--line)'; const fill=earned?hexToRgba(color,0.14):'transparent'; const gc=earned?color:'var(--text-muted)'; const lock=earned?'':`<span class="lock">${LOCK_SVG}</span>`; return `<div class="medallion" style="border-color:${ring};background:${fill};color:${gc};">${glyph}${lock}</div>`; }
function badgeCellHtml(name,desc,glyph,color,earned,progressText){ return `<div class="panel badge-cell ${earned?'earned':'locked'}" style="--corner:${earned?color:'var(--line)'};">${medallionHtml(glyph,color,earned)}<div class="badge-name">${name}</div><div class="badge-desc">${desc}</div>${(!earned&&progressText)?`<div class="badge-progress">${progressText}</div>`:''}</div>`; }
function trophyHtml(glyph,metal,glow,earned){ if(!earned) return `<div class="trophy-wrap"><div class="trophy-coin locked"><span>${glyph}</span><span class="trophy-lock">${LOCK_SVG}</span></div><div class="trophy-stand locked"></div></div>`; return `<div class="trophy-wrap"><div class="trophy-coin" style="background:radial-gradient(circle at 32% 28%,rgba(255,255,255,0.65),rgba(255,255,255,0) 40%),${metal};box-shadow:0 8px 18px rgba(0,0,0,0.3),0 0 14px ${hexToRgba(glow,0.4)},inset 0 -5px 8px rgba(0,0,0,0.2),inset 0 3px 6px rgba(255,255,255,0.35);"><span class="trophy-shine"></span><span style="position:relative;color:#1B1D21;">${glyph}</span></div><div class="trophy-stand" style="background:${glow};filter:brightness(0.65);"></div></div>`; }
function trophyCellHtml(name,desc,glyph,metal,glow,tier,earned,progressText){ return `<div class="panel badge-cell ${earned?'earned':'locked'}" style="--corner:${earned?glow:'var(--line)'};">${trophyHtml(glyph,metal,glow,earned)}${tier?`<div class="trophy-tier" style="color:${earned?glow:'var(--text-muted)'};">${tier}</div>`:''}<div class="badge-name">${name}</div><div class="badge-desc">${desc}</div>${(!earned&&progressText)?`<div class="badge-progress">${progressText}</div>`:''}</div>`; }

function renderProfile(){
  const myEvents=getMyEvents(); const myCats=getMyCategories(); const count=myEvents.length;
  const card=state.myCard;

  // Extended card fields
  let cardExt={motto:'',pattern:'lines',areas:[],accentColor:'#CBA43A',bgStyle:'obsidian',patternOpacity:0.18};
  try{ const r=localStorage.getItem('card_ext:'+state.profileName); if(r) cardExt={...cardExt,...JSON.parse(r)}; }catch(e){}
  let profilePhoto='';
  try{ profilePhoto=localStorage.getItem('card_photo:'+state.profileName)||''; }catch(e){}
  let profileAbout='';
  try{ profileAbout=localStorage.getItem('profile_about:'+state.profileName)||''; }catch(e){}
  let profileInterests=[];
  try{ const pi=localStorage.getItem('profile_interests:'+state.profileName); if(pi) profileInterests=JSON.parse(pi); }catch(e){}

  // Level + badges
  let earnedCount=0;
  MILESTONE_BADGES.forEach(b=>{ if(count>=b.need) earnedCount++; });
  CATEGORY_BADGES.forEach(b=>{ if(myCats.has(b.cat)) earnedCount++; });
  if(myCats.size>=TOTAL_CATEGORIES) earnedCount++;
  earnedCount+=state.specialBadges.length;
  const lv=getLevel(earnedCount);
  const nextLvIdx=LEVELS.findIndex(l=>l===lv)+1;
  const nextLv=LEVELS[nextLvIdx];

  const topAreas=cardExt.areas||[];

  // Card HTML (inline profile card)
  function profileCardHtml(c,ext){
    const cols=resolveCardColors(ext.bgStyle||c?.theme||'obsidian', ext.accentColor||c?.accentColor||'#CBA43A');
    const {bg,accent,text:textCol,textSoft}=cols;
    const pat=CARD_PATTERNS[ext.pattern||'lightning']||'';
    const tagBg=cols.dark?'rgba(255,255,255,0.14)':'rgba(0,0,0,0.08)';
    const tagBorder=cols.dark?'rgba(255,255,255,0.2)':'rgba(0,0,0,0.12)';
    const tags=c&&c.interests?c.interests.split(',').slice(0,5).map(s=>`<span class="id-card-tag" style="background:${tagBg};border:1px solid ${tagBorder};color:${textCol};">${escapeHtml(s.trim())}</span>`).join(''):'';
    const borderStyle=lv.ring;
    const shadowStyle=`0 8px 28px rgba(0,0,0,0.22),0 0 0 1px rgba(0,0,0,0.08),0 0 18px ${lv.glow}`;
    const initStr=(c?.name||state.profileName).split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
    const photoSticker=profilePhoto
      ?`<div style="width:52px;height:52px;border-radius:50%;overflow:hidden;border:2px solid ${accent};flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,0.3);"><img src="${profilePhoto}" style="width:100%;height:100%;object-fit:cover;display:block;"/></div>`
      :`<div style="width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${accent}22;border:2px solid ${accent}55;flex-shrink:0;font-size:18px;font-weight:800;color:${accent};">${initStr}</div>`;
    return `<div class="id-card profile-id-card prof-avatar-float" style="background:${bg};border:${borderStyle};box-shadow:${shadowStyle};">
      <div style="position:absolute;inset:0;pointer-events:none;color:${accent};opacity:${ext.patternOpacity||0.35};">${pat}</div>
      <div class="ce-card-shine"></div>
      <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px;">
          <div>
            <div class="id-card-label" style="color:${textSoft};">// Cumulus Pass</div>
            <div style="width:24px;height:2px;background:${accent};border-radius:99px;margin-top:4px;"></div>
          </div>
          ${photoSticker}
        </div>
        <div class="id-card-name" style="color:${textCol};">${escapeHtml(c?c.name:state.profileName)}</div>
        ${ext.motto?`<div style="font-size:11px;font-style:italic;font-weight:700;color:${accent};margin-bottom:4px;">"${escapeHtml(ext.motto)}"</div>`:''}
        ${c&&c.bio?`<div class="id-card-bio" style="color:${textSoft};">${escapeHtml(c.bio)}</div>`:''}
        <div class="id-card-tags" style="margin-top:auto;">${tags}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;">
          <div style="font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:${textSoft};">London Member</div>
          <span class="level-badge" style="color:${textCol};border-color:${lv.color};background:${lv.color}33;font-size:8.5px;"><span class="level-dot" style="background:${lv.color};"></span>${lv.title}</span>
        </div>
      </div>
      <div class="id-card-watermark" style="color:${accent};">CU</div>
    </div>`;
  }

  // Night Shot memories — past events with a saved shot
  const memories=myEvents.filter(ev=>eventStatus(ev)==='past'&&(ev.nightShotUrl||localStorage.getItem('night_shot:'+ev.id)));
  const memoriesHtml=memories.slice(0,6).map(ev=>{
    const shotUrl=ev.nightShotUrl||localStorage.getItem('night_shot:'+ev.id);
    const shortTitle=ev.title.length>22?ev.title.substring(0,20)+'…':ev.title;
    return `<div class="ns-tile" onclick="openEvent(${ev.id})">
      <img src="${shotUrl}" alt="${escapeHtml(ev.title)}"/>
      <div class="ns-tile-label">${escapeHtml(shortTitle)}</div>
    </div>`;
  }).join('');

  // Recent events — last 4 only (not 12)
  const recentEvents=myEvents.slice(-4).reverse();
  const MUTED_CATS={'Creative':'rgba(232,184,75,0.10)','Gaming':'rgba(232,184,75,0.10)','Movie Nights':'rgba(232,184,75,0.10)','Board Games':'rgba(232,184,75,0.10)','Meetups':'rgba(232,184,75,0.10)','Food & Drink':'rgba(232,184,75,0.10)','Live Music':'rgba(232,184,75,0.10)','Wellness & Outdoors':'rgba(232,184,75,0.10)','Tech & Talks':'rgba(232,184,75,0.10)'};
  const recentEvHtml=recentEvents.map(ev=>{
    const c2=CATS[ev.category]||{color:'#CBA43A'};
    const mutedBg=hexToRgba(c2.color,0.09);
    const shortTitle=ev.title.length>28?ev.title.substring(0,26)+'…':ev.title;
    const evDate=ev.startsAt?new Date(ev.startsAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'}):'';
    const status=eventStatus(ev);
    const statusDot=status==='live'?`<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#22c55e;margin-right:4px;box-shadow:0 0 5px #22c55e88;"></span>`:status==='upcoming'?`<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${c2.color};margin-right:4px;opacity:0.7;"></span>`:'';
    return `<div class="ev-plate" onclick="openEvent(${ev.id})" style="background:${mutedBg};border:1px solid ${c2.color}28;" title="${escapeHtml(ev.title)}">
      <div style="font-size:12px;font-weight:700;color:var(--text);line-height:1.3;margin-bottom:4px;">${escapeHtml(shortTitle)}</div>
      <div style="font-size:10px;color:var(--text-muted);display:flex;align-items:center;">${statusDot}${escapeHtml(ev.category)}</div>
      ${evDate?`<div style="font-size:10px;color:${c2.color};font-weight:600;margin-top:4px;">${evDate}</div>`:''}
    </div>`;
  }).join('');

  // Interests pills
  const interestPillsHtml=INTEREST_PRESETS.map(tag=>{
    const active=profileInterests.includes(tag);
    return `<button class="interest-pill${active?' active':''}" onclick="toggleProfileInterest('${escapeHtml(tag)}')">${escapeHtml(tag)}</button>`;
  }).join('');

  const badgeHint=nextLv
    ? `${earnedCount} badge${earnedCount!==1?'s':''} earned · ${nextLv.min-earnedCount} more to reach ${nextLv.title}`
    : '✦ Max rank achieved';

  return `
    <!-- Card -->
    <div class="prof-card-section">
      ${profileCardHtml(card,cardExt)}
      <div class="prof-card-btns">
        ${card
          ?`<button class="btn btn-small" onclick="openCardEditor(null)">Edit card</button>
             <button class="btn btn-outline btn-small" onclick="openExpandedCard()">View + QR</button>`
          :`<button class="btn btn-small" style="flex:1;" onclick="openCardEditor(null)">Create your card</button>`}
      </div>
    </div>

    <!-- Stats row -->
    <div class="prof-stats-row">
      <div class="pstat"><div class="pstat-num">${count}</div><div class="pstat-lbl">Events</div></div>
      <div class="pstat"><div class="pstat-num">${state.friends.length}</div><div class="pstat-lbl">Friends</div></div>
      <div class="pstat"><div class="pstat-num">${myTickets.length}</div><div class="pstat-lbl">Tickets</div></div>
      <div class="pstat"><div class="pstat-num">${earnedCount}</div><div class="pstat-lbl">Badges</div></div>
    </div>

    <!-- Achievements card -->
    <div class="prof-achievements-card" onclick="openAchievements()">
      <div class="prof-ach-header">
        <span class="prof-ach-title">Achievements</span>
        <span class="prof-ach-level" style="color:${lv.color};">${lv.title}</span>
      </div>
      <div class="prof-ach-sub">${earnedCount} badge${earnedCount!==1?'s':''} earned${nextLv?` · ${nextLv.min-earnedCount} more to reach ${nextLv.title}`:' · Max rank'}</div>
      <div class="prof-ach-progress"><div class="prof-ach-fill" style="width:${nextLv?Math.min(100,Math.round(((earnedCount-lv.min)/(nextLv.min-lv.min))*100)):100}%;background:${lv.color};"></div></div>
      <div class="prof-ach-cta">View badges &amp; history →</div>
    </div>

    <!-- Action list -->
    <div class="prof-action-list">
      <button class="prof-action-row" onclick="openMyTickets()">
        <span class="prof-action-label">My Tickets</span>
        <span class="prof-action-right">${myTickets.length>0?myTickets.length+' ':''}›</span>
      </button>
      <button class="prof-action-row" onclick="editProfile()">
        <span class="prof-action-label">Edit name &amp; email</span>
        <span class="prof-action-right">›</span>
      </button>
      <button class="prof-action-row prof-action-signout" onclick="signOut()">
        <span class="prof-action-label">Sign out</span>
        <span class="prof-action-right">›</span>
      </button>
    </div>
    ${state.profileEmail==='gondoxml@gmail.com'?`
    <div class="prof-admin-section">
      <div class="prof-admin-label">Admin &amp; Finances</div>
      <div class="prof-action-list">
        <button class="prof-action-row" onclick="openOwnerDash()">
          <span class="prof-action-label">Finances<span class="prof-action-sub">Live revenue &amp; payouts</span></span>
          <span class="prof-action-right">›</span>
        </button>
        <button class="prof-action-row" onclick="openReview()">
          <span class="prof-action-label">Host applications<span class="prof-action-sub">Review &amp; approve hosts</span></span>
          <span class="prof-action-right">›</span>
        </button>
        <button class="prof-action-row" onclick="openEventApprovals()">
          <span class="prof-action-label">Event approvals<span class="prof-action-sub">Review &amp; publish public events</span></span>
          <span class="prof-action-right">›</span>
        </button>
        <button class="prof-action-row prof-action-danger" onclick="clearAllUsers()">
          <span class="prof-action-label">Clear all users<span class="prof-action-sub">Delete every account &amp; email (keeps events)</span></span>
          <span class="prof-action-right">›</span>
        </button>
        <button class="prof-action-row prof-action-danger" onclick="if(confirm('Delete ALL rows in users, events, rsvps, tickets, chat_messages, friends? This cannot be undone.')){clearAllTestData(true)}">
          <span class="prof-action-label">Wipe all test data<span class="prof-action-sub">Users + events + everything</span></span>
          <span class="prof-action-right">›</span>
        </button>
      </div>
    </div>`:''}


    <!-- About me + interests + spots (all in one card) -->
    <div class="prof-about-section">
      <div class="prof-about-label">About me</div>
      <div class="profile-about-wrap">
        <textarea class="profile-about-input" id="profile-about-input" maxlength="150"
          placeholder="Tell people a little about you…"
          oninput="updateAboutCounter(this)"
          onblur="saveProfileAbout(this.value)"
        >${escapeHtml(profileAbout)}</textarea>
        <div class="profile-about-counter" id="about-counter">${profileAbout.length}/150</div>
      </div>

      <div class="prof-divider"></div>
      <div class="prof-about-label">Interests</div>
      <div class="interests-grid" id="interests-grid">${interestPillsHtml}</div>

      ${topAreas.length?`
      <div class="prof-divider"></div>
      <div class="prof-about-label">My London spots</div>
      <div class="area-chips">${topAreas.map(a=>`<div class="area-chip"><span>${escapeHtml(a)}</span></div>`).join('')}
        <button class="btn btn-text btn-small" style="font-size:11px;" onclick="openCardEditor(null)">Edit in card →</button>
      </div>`:
      `<div class="prof-divider"></div>
      <button class="btn btn-text btn-small" style="font-size:12px;padding:0;" onclick="openCardEditor(null)">+ Add your London spots in your card</button>`}
    </div>

    <!-- Night Shot memories -->
    ${memories.length?`
    <div class="profile-section">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <span class="profile-section-label" style="margin-bottom:0;color:#FCD34D;">📸 Memories</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">${memoriesHtml}</div>
    </div>`:''}

    <!-- Recent events (only shown if user has any) -->
    ${recentEvents.length?`
    <div class="profile-section">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <span class="profile-section-label" style="margin-bottom:0;flex:0 0 auto;">Recent events</span>
        ${myEvents.length>4?`<button class="btn btn-text btn-small" onclick="openAchievements()" style="font-size:11px;">See all ${myEvents.length} →</button>`:''}
      </div>
      <div class="ev-plate-grid list-item-stagger">${recentEvHtml}</div>
    </div>`:''}
  `;
}

function openAchievements(){ pushNav(); state.view='achievements'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); }

function renderAchievements(){
  const myEvents=getMyEvents(); const myCats=getMyCategories(); const count=myEvents.length;
  let earnedCount=0;
  MILESTONE_BADGES.forEach(b=>{ if(count>=b.need) earnedCount++; });
  CATEGORY_BADGES.forEach(b=>{ if(myCats.has(b.cat)) earnedCount++; });
  if(myCats.size>=TOTAL_CATEGORIES) earnedCount++;
  earnedCount+=state.specialBadges.length;
  const lv=getLevel(earnedCount);
  const nextLvIdx=LEVELS.findIndex(l=>l===lv)+1;
  const nextLv=LEVELS[nextLvIdx];
  const progressPct=nextLv?Math.min(100,Math.round(((earnedCount-lv.min)/(nextLv.min-lv.min))*100)):100;

  const milestoneCells=MILESTONE_BADGES.map(b=>{ const earned=count>=b.need; return trophyCellHtml(b.name,b.desc,b.glyph,b.metal,b.metal,b.tier,earned,earned?'':`${count} / ${b.need} events`); }).join('');
  const allRounderEarned=myCats.size>=TOTAL_CATEGORIES;
  const allRounderCell=trophyCellHtml(ALLROUNDER_BADGE.name,ALLROUNDER_BADGE.desc,ALLROUNDER_BADGE.glyph,ALLROUNDER_BADGE.metal,ALLROUNDER_BADGE.glow,ALLROUNDER_BADGE.tier,allRounderEarned,allRounderEarned?'':`${myCats.size} / ${TOTAL_CATEGORIES} categories`);
  const categoryCells=CATEGORY_BADGES.map(b=>{ const earned=myCats.has(b.cat); return badgeCellHtml(b.name,b.desc,b.glyph,CATS[b.cat].color,earned,''); }).join('');
  const specialEarned=SPECIAL_BADGES.filter(b=>state.specialBadges.includes(b.id));
  const specialCells=specialEarned.map(b=>badgeCellHtml(b.name,b.desc,b.glyph,'var(--gold)',true,'')).join('');

  // Full event history (all events)
  const allEvents=myEvents.slice().reverse();
  const MUTED_CATS_A={'Creative':'rgba(232,184,75,0.10)','Gaming':'rgba(232,184,75,0.10)','Movie Nights':'rgba(232,184,75,0.10)','Board Games':'rgba(232,184,75,0.10)','Meetups':'rgba(232,184,75,0.10)','Food & Drink':'rgba(232,184,75,0.10)','Live Music':'rgba(232,184,75,0.10)','Wellness & Outdoors':'rgba(232,184,75,0.10)','Tech & Talks':'rgba(232,184,75,0.10)'};
  const evTilesHtml=allEvents.length
    ? allEvents.map(ev=>{
        const c2=CATS[ev.category]||{color:'#CBA43A'};
        const shortTitle=ev.title.length>28?ev.title.substring(0,26)+'…':ev.title;
        const evDate=ev.startsAt?new Date(ev.startsAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'}):'';
        const status=eventStatus(ev);
        const statusDot=status==='live'?`<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#22c55e;margin-right:4px;box-shadow:0 0 5px #22c55e88;"></span>`:status==='upcoming'?`<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${c2.color};margin-right:4px;opacity:0.7;"></span>`:'';
        return `<div class="ev-plate" onclick="openEvent(${ev.id})" style="background:${hexToRgba(c2.color,0.08)};border:1px solid var(--line);border-left:2px solid ${c2.color};">
          <div style="font-size:12px;font-weight:700;color:var(--text);line-height:1.3;margin-bottom:4px;">${escapeHtml(shortTitle)}</div>
          <div style="font-size:10px;color:var(--text-muted);display:flex;align-items:center;">${statusDot}${escapeHtml(ev.category)}</div>
          ${evDate?`<div style="font-size:10px;color:${c2.color};font-weight:600;margin-top:4px;">${evDate}</div>`:''}
        </div>`;
      }).join('')
    : `<div style="color:var(--text-muted);font-size:13px;padding:4px 0;">No events yet — browse and RSVP to get started.</div>`;

  return `<button class="back-btn" onclick="goBack()">←</button>

    <!-- Level hero -->
    <div class="achieve-hero">
      <div class="achieve-badge-big" style="background:${lv.color}22;border-color:${lv.color};color:${lv.color};">${lv.title.substring(0,2).toUpperCase()}</div>
      <div class="achieve-hero-text">
        <div class="achieve-hero-level" style="color:${lv.color};">${lv.title}</div>
        <div class="achieve-hero-sub">${earnedCount} badge${earnedCount!==1?'s':''} earned${nextLv?` · ${nextLv.min-earnedCount} more to reach ${nextLv.title}`:' · Max rank!'}</div>
        <div class="achieve-progress-bar"><div class="achieve-progress-fill" style="width:${progressPct}%;background:${lv.color};"></div></div>
      </div>
    </div>

    <!-- Milestones -->
    <div class="profile-section">
      <div class="profile-section-label">Milestones</div>
      <div class="badge-grid">${milestoneCells}${allRounderCell}</div>
    </div>

    <!-- Categories explored -->
    <div class="profile-section">
      <div class="profile-section-label">Categories explored</div>
      <div class="badge-grid">${categoryCells}</div>
    </div>

    ${specialCells?`
    <div class="profile-section">
      <div class="profile-section-label">Special &amp; community badges</div>
      <div class="badge-grid">${specialCells}</div>
    </div>`:''}

    <!-- Event history (all) -->
    ${allEvents.length?`
    <div class="profile-section">
      <div class="profile-section-label">All events (${allEvents.length})</div>
      <div class="ev-plate-grid list-item-stagger">${evTilesHtml}</div>
    </div>`:''}

    <!-- Redeem -->
    <div class="profile-section">
      <div class="profile-section-label">Badge codes</div>
      <div class="panel redeem-box" style="--corner:var(--gold);">
        <h4>Redeem a badge code</h4>
        <p>Promoters can issue collectible badges. Got a code from an event? Enter it here.</p>
        <div class="redeem-row"><input id="redeem-input" class="redeem-input" placeholder="ENTER CODE" onkeydown="if(event.key==='Enter')redeemBadge()"/><button class="btn" style="background:var(--gold);color:#1a1400;" onclick="redeemBadge()">Redeem</button></div>
        <div class="promoter-note">Running an event and want your own badge? Contact the Cumulus team.</div>
      </div>
    </div>`;
}

function editProfile(){
  state.editingProfile=true; renderNav(); renderView();
}

function updateAboutCounter(el){
  const ctr=document.getElementById('about-counter');
  if(!ctr) return;
  const n=el.value.length;
  ctr.textContent=n+'/150';
  ctr.classList.toggle('warn', n>130);
}

function saveProfileAbout(val){
  try{ localStorage.setItem('profile_about:'+state.profileName, val.trim()); }catch(e){}
}

function toggleProfileInterest(tag){
  let pi=[];
  try{ const r=localStorage.getItem('profile_interests:'+state.profileName); if(r) pi=JSON.parse(r); }catch(e){}
  const idx=pi.indexOf(tag);
  if(idx===-1) pi.push(tag); else pi.splice(idx,1);
  try{ localStorage.setItem('profile_interests:'+state.profileName, JSON.stringify(pi)); }catch(e){}
  // Toggle pill without full re-render
  document.querySelectorAll('.interest-pill').forEach(btn=>{
    if(btn.textContent===tag) btn.classList.toggle('active', pi.includes(tag));
  });
}

function renderCalendar(){
  const weeks=buildCalendarWeeks(CALENDAR_YEAR,CALENDAR_MONTH);
  const eventsByDay={};
  EVENTS.forEach(ev=>{ const d=getEventDay(ev); if(d){ if(!eventsByDay[d]) eventsByDay[d]=[]; eventsByDay[d].push(ev); } });
  const now=new Date(); const todayDay=(now.getFullYear()===CALENDAR_YEAR&&now.getMonth()===CALENDAR_MONTH)?now.getDate():null;
  const cellsHtml=weeks.map(week=>week.map(day=>{
    if(!day) return `<div class="calendar-cell empty"></div>`;
    const dayEvents=eventsByDay[day]||[]; const isToday=day===todayDay;
    const dotN=Math.min(dayEvents.length,4);
    const dots=dayEvents.length?`<div class="cal-dots">${dayEvents.slice(0,dotN).map(ev=>{const cc=(CATS[ev.category]||{color:'var(--accent)'}).color;return `<span class="cal-dot" style="background:${cc};"></span>`;}).join('')}${dayEvents.length>4?`<span class="cal-dot-more">+${dayEvents.length-4}</span>`:''}</div>`:'';
    return `<div class="calendar-cell ${isToday?'today':''} ${dayEvents.length?'has-events':''} pointer" onclick="openCalendarDay(${day})" style="cursor:pointer;"><div class="calendar-day-num">${day}</div>${dots}</div>`;
  }).join('')).join('');
  return `
    <div class="connect-header"><h2>${MONTH_NAMES[CALENDAR_MONTH]} ${CALENDAR_YEAR}</h2><p>What's on this month</p></div>
    <div class="calendar-scroll"><div class="calendar-inner">
      <div class="calendar-header-row">${WEEKDAY_LABELS.map(d=>`<div class="calendar-weekday">${d}</div>`).join('')}</div>
      <div class="calendar-grid">${cellsHtml}</div>
    </div></div>`;
}

// ════════════════════════════════════════════════
// TICKET SYSTEM
// ════════════════════════════════════════════════
function eventPrice(ev){ return ev.price||0; }
function getCumulusFee(ticketPrice){
  if(ticketPrice<=0) return 0;
  if(ticketPrice<=15) return 1.50;
  if(ticketPrice<=40) return 2.50;
  if(ticketPrice<=71) return 3.50;
  return 4.50;
}
function ticketTypes(ev){
  const basePrice=eventPrice(ev);
  if(!basePrice) return [{id:'free',label:'Free Registration',price:0,platformFee:0,desc:'Claim your spot — no charge'}];
  const platformFee=getCumulusFee(basePrice);
  return [{id:'general',label:'General Admission',price:basePrice,platformFee,desc:'Standard entry to the event'}];
}
function generateTicketId(){ return 'CU-'+Math.random().toString(36).slice(2,8).toUpperCase(); }

let myTickets=[];
async function loadMyTickets(){
  if(!state.userId){ const r=await localGet(`tickets:${state.profileName}`); myTickets=r?JSON.parse(r):[]; return; }
  const {data}=await sb.from('tickets').select('*').eq('user_id',state.userId).order('purchased_at',{ascending:false});
  if(data) myTickets=data.map(t=>({
    ticketId:t.ticket_id, bookingId:t.booking_id, seatNum:t.seat_num, totalSeats:t.total_seats,
    eventId:t.event_id, type:t.ticket_type, typeLabel:t.type_label,
    pricePerTicket:t.price_per_ticket, total:t.total,
    purchaserName:t.purchaser_name, purchasedAt:new Date(t.purchased_at).getTime()
  }));
}
async function _insertTickets(tickets){
  if(!state.userId) return;
  const rows=tickets.map(t=>({
    ticket_id:t.ticketId, booking_id:t.bookingId, seat_num:t.seatNum||null, total_seats:t.totalSeats||null,
    event_id:t.eventId, user_id:state.userId, ticket_type:t.type, type_label:t.typeLabel,
    price_per_ticket:t.pricePerTicket, total:t.total,
    purchaser_name:t.purchaserName, purchased_at:new Date(t.purchasedAt).toISOString()
  }));
  await sb.from('tickets').insert(rows);
}
function getTicketForEvent(evId){ return myTickets.find(t=>t.eventId===evId); }

let bookingDraft={eventId:null,type:'general',qty:1,confirmedTicket:null};

function openBook(id){
  pushNav(); bookingDraft={eventId:id,qty:1,confirmedTicket:null};
  const ev=EVENTS.find(e=>e.id===id);
  bookingDraft.type=ev?ticketTypes(ev)[0].id:'general';
  state.view='book'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'});
}
function setBookingType(type){ bookingDraft.type=type; renderView(); }
function setBookingQty(q){ bookingDraft.qty=Math.max(1,Math.min(10,q)); renderView(); }
function proceedToCheckout(){ pushNav(); state.view='checkout'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); }
function openViewTicket(evId){
  pushNav();
  const eventTickets=myTickets.filter(t=>t.eventId===evId);
  if(!eventTickets.length){openBook(evId);return;}
  bookingDraft.confirmedTickets=eventTickets; state.view='confirmed'; renderNav(); renderView();
  window.scrollTo({top:0,behavior:'smooth'});
}
function openMyTickets(){ pushNav(); state.view='my-tickets'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); }

async function registerFree(evId){
  const ev=EVENTS.find(e=>e.id===evId); if(!ev) return;
  const baseId=generateTicketId(); const nf=bookingDraft.qty||1;
  const freeTickets=Array.from({length:nf},(_,i)=>({
    ticketId:nf>1?`${baseId}-${String(i+1).padStart(2,'0')}`:baseId,
    seatNum:nf>1?i+1:null, totalSeats:nf>1?nf:null, bookingId:baseId,
    eventId:ev.id,type:'free',typeLabel:'Free Registration',pricePerTicket:0,total:0,
    purchaserName:state.profileName,purchasedAt:Date.now()
  }));
  myTickets.push(...freeTickets);
  await _insertTickets(freeTickets);
  // RSVP via Supabase
  const list=state.rsvps[ev.id]||[];
  if(!list.includes(state.profileName)){
    await sb.from('rsvps').insert({event_id:ev.id,user_id:state.userId,user_name:state.profileName});
    state.rsvps[ev.id]=[...list,state.profileName];
  }
  bookingDraft.confirmedTickets=freeTickets; navStack=[];
  state.view='confirmed'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'});
}

async function processPayment(){
  const name=(document.getElementById('pay-name')?.value||'').trim();
  const card=(document.getElementById('pay-card')?.value||'').replace(/\s/g,'');
  const expiry=document.getElementById('pay-expiry')?.value||'';
  const cvv=(document.getElementById('pay-cvv')?.value||'').trim();
  if(!name||card.length<15||expiry.length<4||cvv.length<3){ showToast('Please fill in all payment details correctly.','error'); return; }
  const btn=document.getElementById('pay-btn');
  if(btn){btn.disabled=true;btn.innerHTML='<span style="opacity:.7">Processing…</span>';}
  await new Promise(r=>setTimeout(r,1800));
  const ev=EVENTS.find(e=>e.id===bookingDraft.eventId);
  const sel=ticketTypes(ev).find(t=>t.id===bookingDraft.type)||ticketTypes(ev)[0];
  const baseId=generateTicketId(); const n=bookingDraft.qty;
  const platformFee=sel.platformFee||0;
  const totalCharged=sel.price+platformFee;
  const newTickets=Array.from({length:n},(_,i)=>({
    ticketId:n>1?`${baseId}-${String(i+1).padStart(2,'0')}`:baseId,
    seatNum:n>1?i+1:null, totalSeats:n>1?n:null, bookingId:baseId,
    eventId:ev.id, type:sel.id, typeLabel:sel.label,
    pricePerTicket:sel.price, platformFee,
    total:totalCharged,
    purchaserName:state.profileName, purchasedAt:Date.now()
  }));
  myTickets.push(...newTickets);
  await _insertTickets(newTickets);
  const list=state.rsvps[ev.id]||[];
  if(!list.includes(state.profileName)){
    await sb.from('rsvps').insert({event_id:ev.id,user_id:state.userId,user_name:state.profileName});
    state.rsvps[ev.id]=[...list,state.profileName];
  }
  bookingDraft.confirmedTickets=newTickets; navStack=[];
  state.view='confirmed'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'});
}

function formatCardNumber(el){ let v=el.value.replace(/\D/g,'').slice(0,16); el.value=v.replace(/(.{4})/g,'$1 ').trim(); }
function formatExpiry(el){ let v=el.value.replace(/\D/g,'').slice(0,4); if(v.length>2) v=v.slice(0,2)+'/'+v.slice(2); el.value=v; }

function afterRenderConfirmed(){
  const tickets=bookingDraft.confirmedTickets||[]; if(!tickets.length) return;
  tickets.forEach((t,i)=>{
    const el=document.getElementById(`ticket-qr-${i}`); if(!el) return;
    el.innerHTML='';
    try{ new QRCode(el,{text:t.ticketId,width:120,height:120,colorDark:'#000',colorLight:'#fff',correctLevel:QRCode.CorrectLevel.M}); }
    catch(e){ el.innerHTML=`<div style="font-size:10px;word-break:break-all;color:#333;">${t.ticketId}</div>`; }
  });
}

function downloadICS(evId){
  const ev=EVENTS.find(e=>e.id===evId); if(!ev) return;
  const pad=n=>String(n).padStart(2,'0');
  const fmtDT=d=>{ const u=new Date(d); return `${u.getUTCFullYear()}${pad(u.getUTCMonth()+1)}${pad(u.getUTCDate())}T${pad(u.getUTCHours())}${pad(u.getUTCMinutes())}${pad(u.getUTCSeconds())}Z`; };
  const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Cumulus Events//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',
    `UID:cumulus-${ev.id}-${Date.now()}@cumulus.app`,`DTSTART:${fmtDT(ev.startTime)}`,`DTEND:${fmtDT(ev.endTime)}`,
    `SUMMARY:${ev.title}`,`DESCRIPTION:${ev.desc.replace(/[\\;,]/g,'\\$&').replace(/\n/g,'\\n')} — Hosted by ${ev.host}`,
    `LOCATION:${ev.venue}\\, ${ev.area}\\, London`,`ORGANIZER;CN="${ev.host}":mailto:events@cumulus.app`,
    'STATUS:CONFIRMED','TRANSP:OPAQUE','END:VEVENT','END:VCALENDAR'].join('\r\n');
  const blob=new Blob([ics],{type:'text/calendar;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=ev.title.replace(/[^a-z0-9]/gi,'-').replace(/-+/g,'-')+'.ics';
  document.body.appendChild(a); a.click(); setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(url); },1000);
}

// ─── Render: Ticket selection ────────────────────────────────────────────
function renderBook(){
  const ev=EVENTS.find(e=>e.id===bookingDraft.eventId); if(!ev) return '<div class="empty-state">Event not found.</div>';
  const c=CATS[ev.category]; const types=ticketTypes(ev);
  const sel=types.find(t=>t.id===bookingDraft.type)||types[0];
  const isFree=!eventPrice(ev); const qty=bookingDraft.qty;
  const baseTotal=sel.price*qty; const feeTotal=(sel.platformFee||0)*qty; const finalTotal=baseTotal+feeTotal;
  const typeCards=types.map(t=>`
    <div onclick="setBookingType('${t.id}')" style="border:2px solid ${bookingDraft.type===t.id?c.color:'var(--line)'};border-radius:14px;padding:14px 16px;cursor:pointer;background:${bookingDraft.type===t.id?hexToRgba(c.color,0.07):'var(--surface-2)'};transition:all .15s;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
        <div><div style="font-weight:700;font-size:14px;color:var(--text);">${t.label}</div><div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${t.desc}</div></div>
        <div style="font-size:18px;font-weight:800;color:${bookingDraft.type===t.id?c.color:'var(--text)'};">${t.price?`£${t.price.toFixed(2)}`:'Free'}</div>
      </div>
    </div>`).join('');
  return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><span class="event-badge" style="--cat:;">${ev.category}</span><h2>${escapeHtml(ev.title)}</h2><p>${ev.date} · ${escapeHtml(ev.venue)}</p></div>
    <div class="section-title">Choose your ticket</div>
    ${typeCards}
    ${!isFree?`
    <div class="section-title">Quantity</div>
    <div class="panel" style="--corner:var(--accent);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <button class="btn btn-outline" style="width:42px;height:42px;padding:0;font-size:22px;border-radius:50%;flex-shrink:0;" onclick="setBookingQty(${qty-1})">−</button>
      <div style="text-align:center;"><div style="font-size:30px;font-weight:800;color:var(--text);">${qty}</div><div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">ticket${qty!==1?'s':''}</div></div>
      <button class="btn btn-outline" style="width:42px;height:42px;padding:0;font-size:22px;border-radius:50%;flex-shrink:0;" onclick="setBookingQty(${qty+1})">+</button>
    </div>`:''}
    <div class="panel" style="--corner:${c.color};padding:16px 20px;background:${hexToRgba(c.color,0.05)};margin-bottom:18px;">
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.7px;margin-bottom:10px;">Order summary</div>
      <div style="display:flex;justify-content:space-between;font-size:13.5px;color:var(--text-soft);margin-bottom:6px;"><span>${sel.label}${!isFree?` × ${qty}`:''}</span><span>${sel.price?`£${baseTotal.toFixed(2)}`:'Free'}</span></div>
      ${!isFree?`
      <div style="display:flex;justify-content:space-between;font-size:13.5px;color:var(--text-soft);margin-bottom:4px;"><span>Cumulus platform fee</span><span>£${feeTotal.toFixed(2)}</span></div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;font-style:italic;">The host keeps 100% of their ticket price.</div>`:''}
      <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:var(--text);padding-top:10px;border-top:1px solid var(--line);"><span>Total</span><span style="color:${c.color};">${finalTotal?`£${finalTotal.toFixed(2)}`:'Free'}</span></div>
    </div>
    <button class="btn" style="width:100%;background:${c.color};padding:14px;font-size:15px;" onclick="${isFree?`registerFree(${ev.id})`:`proceedToCheckout()`}">${isFree?'Register Free →':`Continue to Payment · £${finalTotal.toFixed(2)} →`}</button>`;
}

// ─── Render: Mock payment ────────────────────────────────────────────────
function renderCheckout(){
  const ev=EVENTS.find(e=>e.id===bookingDraft.eventId); if(!ev) return '';
  const c=CATS[ev.category]; const types=ticketTypes(ev);
  const sel=types.find(t=>t.id===bookingDraft.type)||types[0];
  const total=((sel.price+(sel.platformFee||0))*bookingDraft.qty).toFixed(2);
  return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><h2>Payment</h2><p>${escapeHtml(ev.title)} · ${sel.label} × ${bookingDraft.qty}</p></div>
    <div style="background:var(--gold-tint);border:1px solid var(--gold);border-radius:14px;padding:13px 16px;margin-bottom:20px;font-size:13px;color:var(--text-soft);line-height:1.6;">
      <strong style="color:var(--text);">Test mode</strong> — use card <strong>4242 4242 4242 4242</strong>, any future expiry (e.g. 12/28), any 3-digit CVV.
    </div>
    <div class="panel intro-form" style="--corner:${c.color};">
      <label class="intro-field-label">Name on card</label>
      <input id="pay-name" class="gate-input" placeholder="Name on card" value="${escapeHtml(state.profileName)}" autocomplete="cc-name"/>
      <label class="intro-field-label">Card number</label>
      <input id="pay-card" class="gate-input" placeholder="1234 5678 9012 3456" maxlength="19" inputmode="numeric" oninput="formatCardNumber(this)" autocomplete="cc-number"/>
      <div style="display:flex;gap:12px;">
        <div style="flex:1;"><label class="intro-field-label">Expiry</label><input id="pay-expiry" class="gate-input" placeholder="MM/YY" maxlength="5" inputmode="numeric" oninput="formatExpiry(this)" autocomplete="cc-exp"/></div>
        <div style="flex:1;"><label class="intro-field-label">CVV</label><input id="pay-cvv" class="gate-input" placeholder="123" maxlength="4" inputmode="numeric" autocomplete="cc-csc"/></div>
      </div>
    </div>
    <button id="pay-btn" class="btn" style="width:100%;background:${c.color};padding:14px;font-size:15px;margin-top:4px;" onclick="processPayment()">Pay £${total} →</button>
    <div style="text-align:center;font-size:11px;color:var(--text-muted);margin-top:10px;">Secure test payment — no real charge will occur.</div>`;
}

// ─── Render: Ticket confirmation ─────────────────────────────────────────
function renderConfirmed(){
  const tickets=bookingDraft.confirmedTickets||[]; if(!tickets.length) return '<div class="empty-state">No tickets found.</div>';
  const t0=tickets[0]; const ev=EVENTS.find(e=>e.id===t0.eventId); if(!ev) return '';
  const c=CATS[ev.category]; const purchased=new Date(t0.purchasedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
  const totalPaid=tickets.reduce((s,t)=>s+(t.total||0),0);
  const ticketCards=tickets.map((t,i)=>`
    <div class="panel" style="--corner:${c.color};overflow:visible;margin-bottom:${i<tickets.length-1?'20':'0'}px;border-radius:20px;">
      <div style="position:relative;padding:18px 18px 20px;border-bottom:2px dashed var(--line);">
        <div style="position:absolute;left:-13px;bottom:-14px;width:26px;height:26px;border-radius:50%;background:var(--bg);border:1px solid var(--line);z-index:2;"></div>
        <div style="position:absolute;right:-13px;bottom:-14px;width:26px;height:26px;border-radius:50%;background:var(--bg);border:1px solid var(--line);z-index:2;"></div>
        ${tickets.length>1?`<div style="font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:${c.color};margin-bottom:6px;">Ticket ${t.seatNum} of ${t.totalSeats}</div>`:''}
        <span class="event-badge" style="--cat:;margin-bottom:6px;">${ev.category}</span>
        <div style="font-size:17px;font-weight:800;margin:6px 0 4px;line-height:1.2;color:var(--text);">${escapeHtml(ev.title)}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:1px;">${ev.date} · ${ev.time}</div>
        <div style="font-size:12px;color:var(--text-muted);">${escapeHtml(ev.venue)}, ${escapeHtml(ev.area)}</div>
        <div style="margin-top:12px;display:flex;gap:8px;font-size:12px;">
          <div style="background:var(--surface-2);border-radius:9px;padding:7px 10px;flex:1;"><div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);">Type</div><div style="font-weight:700;color:var(--text);margin-top:1px;">${t.typeLabel}</div></div>
          <div style="background:var(--surface-2);border-radius:9px;padding:7px 10px;flex:1;"><div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);">Paid</div><div style="font-weight:700;color:${c.color};margin-top:1px;">${t.total?`£${t.total.toFixed(2)}`:'Free'}</div></div>
        </div>
      </div>
      <div style="padding:18px;text-align:center;">
        <div id="ticket-qr-${i}" style="width:134px;height:134px;margin:0 auto 10px;background:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;padding:7px;"></div>
        <div style="font-family:ui-monospace,monospace;font-size:11.5px;font-weight:700;color:var(--text);letter-spacing:1.5px;">${t.ticketId}</div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">Show at the door · Purchased ${purchased}</div>
      </div>
    </div>`).join('');
  return `<div style="text-align:center;padding:20px 0 16px;">
      <div style="width:58px;height:58px;border-radius:50%;background:#22C55E;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;font-size:24px;box-shadow:0 4px 18px rgba(34,197,94,0.3);">✓</div>
      <div style="font-size:21px;font-weight:800;color:var(--text);">${totalPaid?'Payment confirmed!':'You\'re registered!'}</div>
      <div style="font-size:12.5px;color:var(--text-muted);margin-top:3px;">${tickets.length} ticket${tickets.length!==1?'s':''} · ${totalPaid?`£${totalPaid.toFixed(2)} total`:'Free'}</div>
    </div>
    ${ticketCards}
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:20px;">
      <button class="btn" style="background:${c.color};" onclick="downloadICS(${ev.id})">+ Add to Calendar</button>
      <button class="btn btn-outline" onclick="openSocialForEvent(${ev.id})">Join Group Chat</button>
      <button class="btn btn-text" onclick="openTicketsTab()">View all my tickets →</button>
    </div>`;
}

// ─── Render: My Tickets list ──────────────────────────────────────────────
function renderMyTickets(){
  if(!myTickets.length) return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><h2>My Tickets</h2><p>All your event bookings</p></div>
    <div class="empty-state">No tickets yet — browse events and book your first one.</div>`;
  const cards=[...myTickets].reverse().map(t=>{
    const ev=EVENTS.find(e=>e.id===t.eventId); if(!ev) return '';
    const c=CATS[ev.category]; const status=eventStatus(ev);
    const d=new Date(t.purchasedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'});
    return `<div class="panel" style="--corner:${c.color};padding:16px 18px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:12px;">
        <div style="flex:1;min-width:0;">
          <span class="event-badge" style="--cat:;font-size:10px;">${ev.category}</span>
          ${status==='live'?`<span class="live-chip" style="margin-left:6px;"><span class="dot"></span>Live</span>`:''}
          <div style="font-size:15px;font-weight:700;margin:6px 0 3px;line-height:1.2;">${escapeHtml(ev.title)}</div>
          <div style="font-size:12px;color:var(--text-muted);">${ev.date} · ${escapeHtml(ev.venue)}</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">${t.qty} × ${t.typeLabel}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:16px;font-weight:800;color:${c.color};">${t.total?`£${t.total.toFixed(2)}`:'Free'}</div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">Booked ${d}</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--line);">
        <div style="font-family:ui-monospace,monospace;font-size:11px;font-weight:700;color:var(--text-muted);">${t.ticketId}</div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-outline btn-small" onclick="downloadICS(${ev.id})">+ Cal</button>
          <button class="btn btn-small" style="background:${c.color};" onclick="openViewTicket(${ev.id})">Ticket</button>
        </div>
      </div>
    </div>`;
  }).join('');
  return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><h2>My Tickets</h2><p>${myTickets.length} booking${myTickets.length!==1?'s':''}</p></div>
    ${cards}`;
}

// ════════════════════════════════════════════════
// CALENDAR DAY VIEW
// ════════════════════════════════════════════════
function openCalendarDay(day){
  pushNav(); state.calendarDay=day; state.view='calendar-day';
  renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'});
}

function renderCalendarDay(){
  const day=state.calendarDay;
  const dateObj=new Date(CALENDAR_YEAR,CALENDAR_MONTH,day);
  const dayLabel=dateObj.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const eventsByDay={};
  EVENTS.forEach(ev=>{ const d=getEventDay(ev); if(d){ if(!eventsByDay[d]) eventsByDay[d]=[]; eventsByDay[d].push(ev); } });
  const dayEvents=(eventsByDay[day]||[]).sort((a,b)=>a.startsAt-b.startsAt);
  if(!dayEvents.length) return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><h2>${dayLabel}</h2><p>Nothing scheduled today</p></div>
    <div class="empty-state">Nothing on this day. <button class="btn-text" onclick="openHost()">Host one?</button></div>`;
  const cards=dayEvents.map(ev=>{
    const c=CATS[ev.category]; const status=eventStatus(ev);
    const att=attendeesFor(ev.id); const ticket=getTicketForEvent(ev.id);
    const price=eventPrice(ev); const spacesLeft=ev.capacity?Math.max(0,ev.capacity-att.length):null;
    return `<div class="panel" style="--corner:${c.color};padding:18px 20px;margin-bottom:12px;">
      <div style="display:flex;align-items:flex-start;gap:12px;justify-content:space-between;">
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
            <span class="event-badge" style="--cat:;margin-bottom:0;">${ev.category}</span>
            ${status==='live'?`<span class="live-chip" style="margin-left:0;"><span class="dot"></span>Live now</span>`:`<span class="upcoming-chip" style="margin-left:0;">Upcoming</span>`}
          </div>
          <div style="font-size:16px;font-weight:800;line-height:1.2;margin-bottom:5px;color:var(--text);">${escapeHtml(ev.title)}</div>
          <div style="font-size:12.5px;color:var(--text-muted);margin-bottom:2px;">${ev.time}</div>
          <div style="font-size:12.5px;color:var(--text-muted);margin-bottom:6px;">${escapeHtml(ev.venue)}, ${escapeHtml(ev.area)}</div>
          <div style="font-size:12px;color:var(--text-soft);">${att.length} going${spacesLeft!==null?` · ${spacesLeft} spaces left`:''} · ${price?`From £${price}`:'Free'}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">
        ${ticket
          ?`<button class="btn btn-small" style="background:#22C55E;" onclick="openViewTicket(${ev.id})">✓ View Ticket</button>`
          :`<button class="btn btn-small" style="background:${c.color};" onclick="openBook(${ev.id})">${price?'Book Now':'Register Free'}</button>`}
        <button class="btn btn-outline btn-small" onclick="downloadICS(${ev.id})">+ Add to Calendar</button>
        <button class="btn btn-text btn-small" onclick="openEvent(${ev.id})">Details</button>
      </div>
    </div>`;
  }).join('');
  return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><h2>${dateObj.toLocaleDateString('en-GB',{weekday:'long'})}, ${dateObj.toLocaleDateString('en-GB',{day:'numeric',month:'long'})}</h2><p>${dayEvents.length} event${dayEvents.length!==1?'s':''}</p></div>
    ${cards}`;
}


// ════════════════════════════════════════════════
// CHAT LOCK
// ════════════════════════════════════════════════
function chatUnlockTime(ev){ return ev.startsAt - 7*24*60*60*1000; }
function chatIsOpen(ev){
  const st=eventStatus(ev);
  if(st==='past') return false; // Close when ended
  if(st==='live') return true;
  return Date.now()>=chatUnlockTime(ev);
}

// ════════════════════════════════════════════════
// CHAT COUNTDOWN TIMERS
// ════════════════════════════════════════════════
const _chatTimers={};
function pad2(n){return String(n).padStart(2,'0');}
function startChatCountdown(evId,unlockTs){
  if(_chatTimers[evId]){clearInterval(_chatTimers[evId]);delete _chatTimers[evId];}
  function tick(){
    const dEl=document.getElementById('chat-cd-d-'+evId);
    if(!dEl){clearInterval(_chatTimers[evId]);delete _chatTimers[evId];return;}
    const rem=unlockTs-Date.now();
    if(rem<=0){clearInterval(_chatTimers[evId]);delete _chatTimers[evId];renderView();return;}
    const ts=Math.floor(rem/1000);
    const d=Math.floor(ts/86400);
    const h=Math.floor((ts%86400)/3600);
    const m=Math.floor((ts%3600)/60);
    const s=ts%60;
    dEl.textContent=d;
    document.getElementById('chat-cd-h-'+evId).textContent=pad2(h);
    document.getElementById('chat-cd-m-'+evId).textContent=pad2(m);
    document.getElementById('chat-cd-s-'+evId).textContent=pad2(s);
  }
  tick();
  _chatTimers[evId]=setInterval(tick,1000);
}

let _socialSeenCount={};
function getUnreadSocialCount(){
  const myEvIds=new Set([
    ...myTickets.map(t=>t.eventId),
    ...Object.keys(state.rsvps).filter(id=>(state.rsvps[id]||[]).includes(state.profileName)).map(Number)
  ]);
  let count=0;
  myEvIds.forEach(eid=>{
    const ev=EVENTS.find(e=>e.id===eid); if(!ev||!chatIsOpen(ev)) return;
    const chat=state.chats[eid]||[];
    const seen=_socialSeenCount[eid];
    if (seen === undefined) {
      count++; // newly opened chat
    } else if (chat.length > seen && chat[chat.length-1].name !== state.profileName) {
      count++; // new messages
    }
  });
  return count;
}
function markSocialSeen(evId){ _socialSeenCount[evId]=(state.chats[evId]||[]).length; }

// ── Nav helpers ──────────────────────────────────────────────────────────
function openTicketsTab(){ state.view='tickets'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); }
function openSocialTab(){  state.view='social';  renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); }
function openSocialForEvent(id){
  pushNav(); loadConnectData(id).then(()=>{ markSocialSeen(id); state.view='connect'; state.selectedEventId=id; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); });
}

// ── Tickets tab ──────────────────────────────────────────────────────────
function renderTicketsTab(){
  const byEvent={};
  myTickets.forEach(t=>{ if(!byEvent[t.eventId]) byEvent[t.eventId]=[]; byEvent[t.eventId].push(t); });
  const sortedIds=Object.keys(byEvent).map(Number).sort((a,b)=>{
    const ea=EVENTS.find(e=>e.id===a), eb=EVENTS.find(e=>e.id===b);
    return (ea?.startsAt||0)-(eb?.startsAt||0);
  });
  const upcoming=sortedIds.filter(id=>{ const ev=EVENTS.find(e=>e.id===id); return ev&&eventStatus(ev)!=='past'; });
  const past=sortedIds.filter(id=>{ const ev=EVENTS.find(e=>e.id===id); return ev&&eventStatus(ev)==='past'; });

  const renderGroup=(ids,label)=>{
    if(!ids.length) return '';
    const cards=ids.map(evId=>{
      const ev=EVENTS.find(e=>e.id===evId); if(!ev) return '';
      const c=CATS[ev.category]; const tickets=byEvent[evId];
      const status=eventStatus(ev); const chatOpen=chatIsOpen(ev);
      const total=tickets.reduce((s,t)=>s+(t.total||0),0);
      return `<div class="panel" style="--corner:${c.color};padding:16px 18px;margin-bottom:12px;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px;">
          <div style="flex:1;min-width:0;">
            <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:5px;">
              <span class="event-badge" style="--cat:;margin-bottom:0;">${ev.category}</span>
              ${status==='live'?`<span class="live-chip" style="margin-left:0;"><span class="dot"></span>Live</span>`:''}
              ${chatOpen&&status!=='past'?`<span style="font-size:9.5px;font-weight:700;color:var(--accent);background:rgba(232,184,75,0.12);padding:2px 7px;border-radius:999px;border:1px solid var(--accent);">Chat open</span>`:''}
            </div>
            <div style="font-size:15px;font-weight:700;line-height:1.2;margin-bottom:4px;">${escapeHtml(ev.title)}</div>
            <div style="font-size:12px;color:var(--text-muted);">${ev.date} · ${ev.time}</div>
            <div style="font-size:12px;color:var(--text-muted);">${escapeHtml(ev.venue)}, ${escapeHtml(ev.area)}</div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-size:15px;font-weight:800;color:${c.color};">${total?`£${total.toFixed(2)}`:'Free'}</div>
            <div style="font-size:11px;color:var(--text-muted);">${tickets.length} ticket${tickets.length!==1?'s':''}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-small" style="background:${c.color};" onclick="openViewTicket(${evId})">View Ticket${tickets.length>1?'s':''}</button>
          ${chatOpen&&status!=='past'?`<button class="btn btn-outline btn-small" onclick="openSocialForEvent(${evId})">Join Chat</button>`:''}
          <button class="btn btn-text btn-small" onclick="downloadICS(${evId})">+ Cal</button>
        </div>
      </div>`;
    }).join('');
    return `<div class="section-title">${label}</div>${cards}`;
  };

  if(!myTickets.length) return `
    <div class="connect-header" style="padding-top:16px;"><h2>My Tickets</h2><p>Your event bookings</p></div>
    <div class="empty-state">No tickets yet — browse events and book your first one.<br><br><button class="btn" onclick="goBrowse()">Browse Events</button></div>`;
  return `
    <div class="connect-header" style="padding-top:16px;"><h2>My Tickets</h2><p>${upcoming.length} upcoming · ${past.length} past</p></div>
    ${renderGroup(upcoming,'Upcoming')}
    ${renderGroup(past,'Past')}`;
}

// ── Social tab ────────────────────────────────────────────────────────────
let _hostType='private';
function setHostType(t){
  _hostType=t;
  document.querySelectorAll('.host-type-btn').forEach(b=>b.classList.toggle('active',b.dataset.type===t));
  const notice=document.getElementById('host-type-notice');
  if(notice) notice.textContent=t==='private'
    ?'Visible to your friends only — no approval needed.'
    :'Your event will go live after a short verification review.';
  const btn=document.getElementById('host-submit-btn');
  if(btn) btn.textContent=t==='private'?'Create private event →':'Submit for review →';
}

function renderSocialTab(){
  const view=state.view;
  const isOwner=state.profileEmail==='gondoxml@gmail.com';

  const seg=`<div class="social-seg">
    <button class="social-seg-btn${view==='social'?' active':''}" onclick="openSocialTab()">Events</button>
    <button class="social-seg-btn${view==='friends'?' active':''}" onclick="openFriends()">Friends${state.friends.length?` (${state.friends.length})`:''}</button>
    <button class="social-seg-btn${view==='host'?' active':''}" onclick="openHost()">Host</button>
  </div>`;

  // ── HOST content ──────────────────────────────────────────────────────
  if(view==='host'){
    return `
      <div class="connect-header" style="padding-top:16px;"><h2>Social</h2><p>Host an event for your community</p></div>
      ${seg}
      <div class="host-type-seg">
        <button class="host-type-btn${_hostType==='private'?' active':''}" data-type="private" onclick="setHostType('private')">Private</button>
        <button class="host-type-btn${_hostType==='public'?' active':''}" data-type="public" onclick="setHostType('public')">Public</button>
      </div>
      <div id="host-type-notice" class="host-notice">${_hostType==='private'?'Visible to your friends only — no approval needed.':'Your event will go live after a short verification review.'}</div>

      <div class="host-section">
        <div class="host-section-title">Event basics</div>
        <label class="intro-field-label">Title</label>
        <input id="host-title" class="gate-input" placeholder="e.g., Summer Park Picnic"/>
        <label class="intro-field-label">Category</label>
        <select id="host-cat" class="gate-input">${Object.keys(CATS).map(c=>`<option value="${c}">${c}</option>`).join('')}</select>
        <label class="intro-field-label">Description</label>
        <textarea id="host-desc" class="gate-input" rows="3" placeholder="What's the vibe? What should people expect?"></textarea>
      </div>

      <div class="host-section">
        <div class="host-section-title">Date &amp; time</div>
        <label class="intro-field-label">Start date</label>
        <input id="host-start-date" type="date" class="gate-input"/>
        <label class="intro-field-label">Start time</label>
        <input id="host-start-time" type="time" class="gate-input"/>
        <label class="intro-field-label" style="margin-top:14px;">End date</label>
        <input id="host-end-date" type="date" class="gate-input"/>
        <label class="intro-field-label">End time</label>
        <input id="host-end-time" type="time" class="gate-input"/>
      </div>

      <div class="host-section" style="overflow:visible;">
        <div class="host-section-title">Location</div>
        <label class="intro-field-label">Search address</label>
        <div style="position:relative;margin-bottom:10px;">
          <input id="host-address-search" class="gate-input" placeholder="Street name or postcode..." oninput="handleAddressAutocomplete()" autocomplete="off"/>
          <div id="autocomplete-results" style="position:absolute;top:100%;left:0;right:0;background:var(--surface);border:1px solid var(--line);border-radius:12px;max-height:200px;overflow-y:auto;z-index:2000;display:none;box-shadow:0 8px 20px var(--shadow);"></div>
        </div>
        <div id="host-map-picker"></div>
        <div id="host-lat-lon-text" style="font-size:11px;color:var(--text-muted);margin:6px 0 10px;font-weight:600;">Default: Central London — search above or tap map to pin exact location</div>
        <label class="intro-field-label">Venue name</label>
        <input id="host-venue" class="gate-input" placeholder="e.g., The Rooftop, Community Hall"/>
        <label class="intro-field-label">Area (optional)</label>
        <input id="host-area" class="gate-input" placeholder="e.g., Shoreditch"/>
      </div>

      <div class="host-section">
        <div class="host-section-title">Capacity</div>
        <label class="intro-field-label">Max attendees</label>
        <input id="host-capacity" type="number" min="1" class="gate-input" placeholder="e.g., 20"/>
      </div>

      <div class="host-section">
        <div class="host-section-title">Pricing</div>
        <label class="intro-field-label">Ticket Price (£) — You keep 100%</label>
        <input id="host-price" type="number" min="0" step="0.01" class="gate-input" placeholder="e.g. 10 (Leave blank for free)"/>
        <div class="host-notice">We add a flat, transparent platform fee to the buyer at checkout to cover processing. You keep every penny of your ticket price.</div>
      </div>

      <button id="host-submit-btn" class="btn" style="width:100%;margin-bottom:16px;font-size:15px;" onclick="submitHostEvent()">${_hostType==='private'?'Create private event →':'Submit for review →'}</button>
      ${renderHostPayoutsPanel()}`;
  }

  // ── FRIENDS content ───────────────────────────────────────────────────
  if(view==='friends'){
    const friendCards=state.friends.length
      ? state.friends.map(n=>{
          const p=personByName(n);
          const evs=p?p.events.map(id=>EVENTS.find(e=>e.id===id)).filter(Boolean):[];
          return `<div class="panel friend-card" style="--corner:var(--gold);">
            <div class="fname"><span class="star">★</span> ${escapeHtml(n)}</div>
            ${p?`<div class="fblurb">${escapeHtml(p.blurb)}</div>`:''}
            <div class="fgoing">${evs.length?`Going to: ${evs.map(e=>escapeHtml(e.title)).join(', ')}`:'No events listed'}</div>
            <button class="btn btn-outline btn-small" style="width:100%;margin-top:4px;" onclick="removeFriend('${escapeHtml(n).replace(/'/g,"\\'")}')">Remove</button>
          </div>`;
        }).join('')
      : `<div class="panel" style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;line-height:1.6;">No friends yet.<br>Scan someone's QR code at an event to add them.</div>`;

    return `
      <div class="connect-header" style="padding-top:16px;"><h2>Social</h2><p>Your friends &amp; connections</p></div>
      ${seg}
      <div class="section-title" style="margin-top:0;">Your friends (${state.friends.length})</div>
      <div class="friends-grid">${friendCards}</div>`;
  }

  // ── EVENTS content ────────────────────────────────────────────────────
  const myEvIds=new Set([
    ...myTickets.map(t=>t.eventId),
    ...Object.keys(state.rsvps).filter(id=>(state.rsvps[id]||[]).includes(state.profileName)).map(Number)
  ]);
  const evList=[...myEvIds].map(id=>EVENTS.find(e=>e.id===id)).filter(Boolean)
    .sort((a,b)=>a.startsAt-b.startsAt);
  const upcoming=evList.filter(e=>eventStatus(e)!=='past');
  const past=evList.filter(e=>eventStatus(e)==='past');

  const renderEvCard=(ev)=>{
    const c=CATS[ev.category]; const chat=state.chats[ev.id]||[];
    const open=chatIsOpen(ev); const status=eventStatus(ev);
    const att=attendeesFor(ev.id);
    const lastMsg=chat.length?chat[chat.length-1]:null;
    const seen=_socialSeenCount[ev.id];
    const isNewOpen=seen===undefined;
    const hasUnread=isNewOpen||(chat.length>seen&&lastMsg?.name!==state.profileName);
    return `<div class="panel" onclick="openSocialForEvent(${ev.id})" style="--corner:${open&&status!=='past'?c.color:'var(--line)'};padding:16px 18px;margin-bottom:10px;cursor:pointer;transition:transform .12s ease;" onmouseenter="this.style.transform='translateY(-2px)'" onmouseleave="this.style.transform=''">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
        <div style="flex:1;min-width:0;">
          <div style="display:flex;gap:6px;align-items:center;margin-bottom:4px;flex-wrap:wrap;">
            <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;background:${c.color};color:#fff;">${ev.category}</span>
            ${status==='live'?`<span class="live-chip" style="margin-left:0;"><span class="dot"></span>Live</span>`:''}
            ${hasUnread?`<span style="font-size:9px;font-weight:800;background:#E23B3B;color:#fff;padding:1px 6px;border-radius:999px;">${isNewOpen&&chat.length===0?'Chat Open':'New'}</span>`:''}
          </div>
          <div style="font-size:14.5px;font-weight:700;line-height:1.2;margin-bottom:3px;">${escapeHtml(ev.title)}</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:2px;">${ev.date} · ${ev.time}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:5px;">${escapeHtml(ev.venue)}${ev.area?` · ${escapeHtml(ev.area)}`:''} · ${att.length} going</div>
          ${open&&status!=='past'
            ? lastMsg
              ? `<div style="font-size:12.5px;color:var(--text-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><strong style="color:var(--text);">${escapeHtml(lastMsg.name.split(' ')[0])}:</strong> ${escapeHtml(lastMsg.text)}</div>`
              : `<div style="font-size:12px;color:var(--text-muted);font-style:italic;">No messages yet — be the first to say hi</div>`
            : status==='past'
              ? `<div style="font-size:12px;color:var(--text-muted);">Event ended — chat closed</div>`
              : (()=>{ const d=Math.ceil((chatUnlockTime(ev)-Date.now())/(86400000)); return `<div style="font-size:12px;color:var(--accent);font-weight:600;">🔒 Chat opens in ${d>0?`${d} day${d!==1?'s':''}`:'less than a day'}</div>`; })()
          }
        </div>
        <div style="flex-shrink:0;color:var(--text-muted);font-size:18px;align-self:center;">›</div>
      </div>
    </div>`;
  };

  const myCardBanner=state.myCard
    ?`<div class="panel" style="--corner:var(--accent);display:flex;align-items:center;gap:14px;padding:14px 16px;margin-bottom:4px;cursor:pointer;" onclick="openExpandedCard()">
        <div style="width:46px;height:46px;border-radius:10px;background:var(--accent);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:20px;font-weight:900;color:#fff;letter-spacing:-1px;">CU</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:14px;font-weight:700;color:var(--text);">My Card &amp; QR Code</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:1px;">Show this to connect with people at events</div>
        </div>
        <div style="font-size:20px;color:var(--text-muted);">›</div>
      </div>`
    :`<div class="panel" style="--corner:var(--accent);padding:14px 16px;margin-bottom:4px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:6px;">Set up your card to share at events</div>
        <button class="btn btn-small" style="width:100%;" onclick="openCardEditor(null)">Create my card</button>
      </div>`;

  if(!evList.length) return `
    <div class="connect-header" style="padding-top:16px;"><h2>Social</h2><p>Connect with people at events</p></div>
    ${seg}
    <div class="section-title" style="margin-top:0;">Your card</div>
    ${myCardBanner}
    <div class="empty-state" style="margin-top:16px;">
      <div style="font-weight:700;margin-bottom:6px;">No events yet</div>
      <div style="font-size:13px;color:var(--text-muted);margin-bottom:18px;">RSVP to events to join their group chats and meet other attendees.</div>
      <button class="btn" onclick="goBrowse()">Browse events</button>
    </div>`;

  return `
    <div class="connect-header" style="padding-top:16px;"><h2>Social</h2><p>${upcoming.length} upcoming · ${past.length} past</p></div>
    ${seg}
    <div class="section-title" style="margin-top:0;">Your card</div>
    ${myCardBanner}
    ${upcoming.length?`<div class="section-title">Upcoming</div>${upcoming.map(renderEvCard).join('')}`:''}
    ${past.length?`<div class="section-title">Past</div>${past.map(renderEvCard).join('')}`:''}`;
}

// Boot. Never let an unexpected rejection leave the user on a blank screen.
start().catch(e=>{ console.error('Boot failed, showing gate:',e); try{ renderGate(); }catch(_){} });

// ══════════════════════════════════════════════
// PROFESSIONAL POLISH — PHASE II JAVASCRIPT
// View transitions · Ripples · Scroll reveal · Stagger
// ══════════════════════════════════════════════

// --- View transition wrapper ---
const _origRenderView = renderView;
renderView = function() {
  _origRenderView.apply(this, arguments);
  const container = document.getElementById('view-container');
  if (container && state.view !== 'browse') {
    container.classList.remove('view-enter');
    void container.offsetWidth; // force reflow
    container.classList.add('view-enter');
    // Stagger child panels
    const panels = container.querySelectorAll('.panel, .friend-card, .intro-card, .badge-cell, .stat-box');
    panels.forEach((el, i) => {
      el.style.animationDelay = `${i * 0.045}s`;
      el.classList.add('stagger-item');
    });
    // Scroll reveal observer
    requestAnimationFrame(() => setupReveal(container));
  }
};

// --- Scroll reveal via IntersectionObserver ---
function setupReveal(root) {
  if (!window.IntersectionObserver) return;
  const els = (root || document).querySelectorAll('.panel, .section-title, .connect-header, .back-btn');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.08 });
  els.forEach(el => { el.classList.add('reveal'); obs.observe(el); });
}

// --- Button ripple effect ---
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.btn:not(.btn-text)');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const ripple = document.createElement('span');
  ripple.className = 'btn-ripple';
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size/2}px;top:${e.clientY - rect.top - size/2}px;`;
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}, { passive: true });


// --- Gate card: add stagger to form fields ---
const _origRenderGate = renderGate;
renderGate = function() {
  _origRenderGate.apply(this, arguments);
  requestAnimationFrame(() => {
    const fields = document.querySelectorAll('#gate-root label, #gate-root input, #gate-root button, #gate-root p');
    fields.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      setTimeout(() => {
        el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        el.style.opacity = '';
        el.style.transform = '';
      }, 220 + i * 60);
    });
  });
};

// --- Card editor stagger ---
const _origRenderCardEditor = renderCardEditor;
renderCardEditor = function() {
  _origRenderCardEditor.apply(this, arguments);
  requestAnimationFrame(() => {
    const fields = document.querySelectorAll('#card-editor-root label, #card-editor-root input, #card-editor-root textarea, #card-editor-root button');
    fields.forEach((el, i) => {
      el.style.opacity = '0';
      setTimeout(() => {
        el.style.transition = 'opacity 0.28s ease';
        el.style.opacity = '';
      }, 180 + i * 50);
    });
  });
};

// --- Smooth map caption on load ---
window.addEventListener('load', () => {
  setTimeout(() => setupReveal(document.getElementById('view-container')), 300);
});

// ══════════════════════════════════════════
// PWA SETUP — iOS Home Screen App
// ══════════════════════════════════════════
(function setupPWA() {
  // 1. Generate the 180×180 Apple Touch Icon via canvas
  function buildAppIcon() {
    try {
      const size = 180;
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d');

      // Background — dark blue/slate gradient
      const bg = ctx.createLinearGradient(0, 0, size, size);
      bg.addColorStop(0, '#0c1a2e');
      bg.addColorStop(0.55, '#0f2744');
      bg.addColorStop(1, '#1a3a5e');
      ctx.fillStyle = bg;
      // Rounded rect (iOS clips to squircle, but we add a mild radius)
      const r = 36;
      ctx.beginPath();
      ctx.moveTo(r, 0); ctx.lineTo(size - r, 0);
      ctx.quadraticCurveTo(size, 0, size, r);
      ctx.lineTo(size, size - r);
      ctx.quadraticCurveTo(size, size, size - r, size);
      ctx.lineTo(r, size); ctx.quadraticCurveTo(0, size, 0, size - r);
      ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.fill();

      // Soft glow in top-left
      const glow = ctx.createRadialGradient(30, 30, 0, 60, 55, 120);
      glow.addColorStop(0, 'rgba(232,184,75,0.28)');
      glow.addColorStop(1, 'rgba(232,184,75,0)');
      ctx.fillStyle = glow;
      ctx.fill();

      // Cloud shape (main) — white, centered slightly above middle
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.96)';
      const cx = size / 2, cy = size / 2 - 6;
      // Body
      ctx.beginPath();
      ctx.ellipse(cx, cy + 16, 46, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      // Left bump
      ctx.beginPath();
      ctx.ellipse(cx - 26, cy + 8, 24, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      // Right bump
      ctx.beginPath();
      ctx.ellipse(cx + 22, cy + 6, 26, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      // Top centre bump
      ctx.beginPath();
      ctx.ellipse(cx, cy - 8, 28, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Accent dot — sky blue
      ctx.save();
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(cx + 22, cy + 6, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // "CU" wordmark at the bottom
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '700 18px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CUMULUS', size / 2, size - 20);
      ctx.restore();

      return c.toDataURL('image/png');
    } catch (e) { return ''; }
  }

  const iconDataURL = buildAppIcon();
  if (iconDataURL) {
    document.getElementById('pwa-apple-icon').href = iconDataURL;
    document.getElementById('pwa-apple-icon-precomposed').href = iconDataURL;
  }

  // 2. Inject a Web App Manifest (works for Android/Chrome; iOS uses meta tags above)
  try {
    const manifest = {
      name: 'Cumulus',
      short_name: 'Cumulus',
      description: 'London community events — your city, your people.',
      start_url: './',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#090A0C',
      theme_color: '#3E7CB8',
      icons: iconDataURL ? [
        { src: iconDataURL, sizes: '180x180', type: 'image/png', purpose: 'any maskable' }
      ] : []
    };
    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
    document.getElementById('pwa-manifest-link').href = URL.createObjectURL(blob);
  } catch (e) {}

  // 3. Register service worker for offline caching (only works when served over HTTPS)
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    const swCode = `
const CACHE = 'cumulus-v1';
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.add(self.location.pathname.replace(/\\/sw\\.js$/,'/') || '/'))
  );
  self.skipWaiting();
});
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});`;
    try {
      const swBlob = new Blob([swCode], { type: 'text/javascript' });
      // Note: blob: URL service workers are rejected by iOS Safari.
      // For full offline support, host sw.js alongside index.html on your server.
      navigator.serviceWorker.register(URL.createObjectURL(swBlob)).catch(() => {});
    } catch (e) {}
  }
})();
