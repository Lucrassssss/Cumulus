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

export { EVENT_SEED, EVENTS, CATS, CAT_IMG, catImg, eventStatus, isHotEvent, generateUniqueId, codeFor, DEMO_PEOPLE, personByName, CARD_BG_STYLES, CARD_ACCENT_COLORS, CARD_THEMES, CARD_PATTERNS, LONDON_AREAS, CATEGORY_KEYWORDS, MILESTONE_BADGES, CATEGORY_BADGES, ALLROUNDER_BADGE, TOTAL_CATEGORIES, SPECIAL_BADGES, LEVELS, getLevel, INTEREST_PRESETS, CALENDAR_YEAR, CALENDAR_MONTH, MONTH_NAMES, WEEKDAY_LABELS, BLOT_SVG, EMAIL_PATTERN, DAY_EPOCH };
