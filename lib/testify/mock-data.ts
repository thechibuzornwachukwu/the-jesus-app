import type { Testimony } from './types';

export const MOCK_TESTIMONIES: Testimony[] = [
  {
    id: 'mock-1',
    title: 'The Night Everything Changed',
    category: 'Salvation',
    full_story: `I had been running from God for fifteen years. Addiction, broken relationships, a career in shambles — I told myself none of it was my fault. Then one night, alone in a motel room in Nashville with nothing but a bottle and a Bible someone had left in the nightstand drawer, I cracked it open for the first time in my adult life.

I opened to Romans 8:38–39 and I wept like a child. Nothing can separate us from the love of God. Not my past. Not my failures. Not even me. I got down on my knees on that ugly carpet and surrendered everything.

That was four years ago. Today I lead a recovery group on Thursday nights at my local church. Six men have given their lives to Christ through that group. God redeemed every wasted year and turned my testimony into someone else's lifeline.`,
    show_streak: true,
    streak_days: 47,
    author: { id: 'user-1', username: 'michael_renewed', avatar_url: undefined },
    reaction_counts: { amen: 214, praying: 87, thankful: 53 },
    user_reaction: null,
    created_at: '2026-03-18T14:22:00Z',
  },
  {
    id: 'mock-2',
    title: 'Stage 3 — and Then God Moved',
    category: 'Healing',
    full_story: `When the oncologist said "stage 3 lymphoma" I went completely numb. I was 34, two kids under five, and a husband who was just starting to follow Jesus alongside me. The treatment plan was aggressive — six months of chemo, possible radiation.

My church rallied around us in a way I still can't fully describe. Meals, babysitting, prayer vigils. But what I want to tell you is what happened at the six-week scan. The imaging team called my oncologist in. They scanned me again. The tumors had shrunk by 70%.

My doctor — not a believer — sat across from me and said, "I don't have a medical explanation for this." She paused. "Do you believe in miracles?" I said, "I do now more than ever." She smiled and said quietly, "So do I."

I finished treatment. I have been in full remission for 18 months. Every morning I wake up is a gift I do not take for granted.`,
    show_streak: false,
    author: { id: 'user-2', username: 'priscilla_faith', avatar_url: undefined },
    reaction_counts: { amen: 389, praying: 201, thankful: 144 },
    user_reaction: null,
    created_at: '2026-03-24T09:11:00Z',
  },
  {
    id: 'mock-3',
    title: 'Groceries on the Exact Right Day',
    category: 'Provision',
    full_story: `We had $14 in the bank account. Rent was three days late. I had been job-hunting for two months after a layoff and we were down to rice and whatever was in the back of the pantry. My wife and I prayed that morning — genuinely believing, but I will be honest, also genuinely afraid.

At 11am our doorbell rang. A woman from our small group was standing there with four bags of groceries. She said, "I felt like God told me to go to the store for you this morning. I don't know why, I just had to obey." She had no idea about the bank account. She had no idea about the pantry.

At 2pm I received a job offer — above my previous salary. I start Monday.

Philippians 4:19 is not just a verse to memorize. It is a promise He keeps.`,
    show_streak: true,
    streak_days: 112,
    author: { id: 'user-3', username: 'james_provision', avatar_url: undefined },
    reaction_counts: { amen: 178, praying: 65, thankful: 210 },
    user_reaction: null,
    created_at: '2026-03-28T16:45:00Z',
  },
  {
    id: 'mock-4',
    title: 'The Door That Would Not Open — Until It Did',
    category: 'Breakthrough',
    full_story: `For three years I applied to the same doctoral program. Three rejections. My advisor told me to consider a different path. My family was politely suggesting the same. I was 29 and felt like God had given me a calling but then padlocked the door to walk it out.

I want to be clear: I did not feel victorious during those three years. I felt confused, overlooked, and at times quietly angry at God. But I kept praying. I kept preparing as if the door would open. I kept treating the calling like it was real even when circumstances said otherwise.

Year four I was accepted. Full funding. My first choice supervisor. I found out later one of my rejection letters had contained a note in the file: "reapply — exceptional candidate, wrong cohort year." God was not saying no. He was saying not yet.

I defend my dissertation in June. Whatever He has called you to — keep preparing for it.`,
    show_streak: false,
    author: { id: 'user-4', username: 'naomi_phd', avatar_url: undefined },
    reaction_counts: { amen: 302, praying: 88, thankful: 167 },
    user_reaction: null,
    created_at: '2026-03-30T11:00:00Z',
  },
  {
    id: 'mock-5',
    title: 'He Restored What the Locust Had Eaten',
    category: 'Restoration',
    full_story: `My marriage was over on paper. Divorce filings had been signed. We had been living apart for eight months and could barely be in the same room without it turning into a battlefield. Two decades of hurt, betrayal, and pride had reduced everything to ash.

A pastor I barely knew asked if he could pray for us — not for the divorce to be smooth, but for the marriage to be restored. I almost said no. My wife almost walked out of the room. But something made us both stay.

We started counseling. We started individual therapy. We started, haltingly, going back to church together. The divorce was never filed.

That was two years ago. I will not pretend it has been easy. But I will tell you that what God rebuilt is stronger than what we originally had, because it is built on something other than our own effort. Joel 2:25 — He restores the years. He means it.`,
    show_streak: false,
    author: { id: 'user-5', username: 'david_and_sarah_w', avatar_url: undefined },
    reaction_counts: { amen: 521, praying: 298, thankful: 184 },
    user_reaction: null,
    created_at: '2026-04-01T07:30:00Z',
  },
];
