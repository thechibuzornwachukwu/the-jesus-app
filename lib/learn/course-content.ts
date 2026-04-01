export interface Lesson {
  title: string;
  scripture: string;
  verse: string;
  body: string;
}

export interface CourseTrack {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export const COURSE_TRACKS: CourseTrack[] = [
  {
    id: 'salvation',
    title: 'Salvation',
    description: 'Understand the gift of grace and new life in Christ.',
    lessons: [
      {
        title: 'The Gift of Grace',
        scripture: 'Ephesians 2:8-9',
        verse: 'For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God.',
        body: 'Salvation is not earned but freely given through faith in Jesus Christ. No amount of good works can purchase what God freely offers.',
      },
      {
        title: 'Repentance and Faith',
        scripture: 'Acts 3:19',
        verse: 'Repent, then, and turn to God, so that your sins may be wiped out, that times of refreshing may come from the Lord.',
        body: 'True repentance means turning away from sin and turning toward God — it is both a decision and a direction.',
      },
      {
        title: 'Born Again',
        scripture: 'John 3:3',
        verse: 'Jesus replied, "Very truly I tell you, no one can see the kingdom of God unless they are born again."',
        body: 'The new birth is a spiritual transformation wrought by the Holy Spirit, not a reform of the old self but the creation of a new one.',
      },
      {
        title: 'Justified by Faith',
        scripture: 'Romans 5:1',
        verse: 'Therefore, since we have been justified through faith, we have peace with God through our Lord Jesus Christ.',
        body: 'Justification means God declares us righteous not because of what we have done, but because of what Christ has done.',
      },
      {
        title: 'Eternal Security',
        scripture: 'John 10:28',
        verse: '"I give them eternal life, and they shall never perish; no one will snatch them out of my hand."',
        body: 'Those who belong to Christ are eternally secure. His grip is stronger than any force that could oppose.',
      },
    ],
  },
  {
    id: 'prayer',
    title: 'Prayer',
    description: 'Develop a deeper, more consistent prayer life.',
    lessons: [
      {
        title: "The Lord's Prayer",
        scripture: 'Matthew 6:9-13',
        verse: '"This, then, is how you should pray: Our Father in heaven, hallowed be your name, your kingdom come, your will be done."',
        body: "Jesus gave us a model prayer that covers praise, petition, and surrender — a template for all of life's conversations with God.",
      },
      {
        title: 'Praying with Faith',
        scripture: 'Mark 11:24',
        verse: '"Therefore I tell you, whatever you ask for in prayer, believe that you have received it, and it will be yours."',
        body: "Faith-filled prayer expects God to act according to His perfect will, not ours — it aligns our desires with Heaven's agenda.",
      },
      {
        title: 'Persistent Prayer',
        scripture: 'Luke 18:1',
        verse: 'Then Jesus told his disciples a parable to show them that they should always pray and not give up.',
        body: "God honors persistent, faithful prayer. Don't mistake His timing for His absence — He hears every word.",
      },
      {
        title: 'Intercession',
        scripture: '1 Timothy 2:1',
        verse: 'I urge, then, first of all, that petitions, prayers, intercession and thanksgiving be made for all people.',
        body: 'Intercession is standing in the gap on behalf of others before God — one of the most powerful acts of love we can perform.',
      },
      {
        title: 'Listening in Prayer',
        scripture: '1 Samuel 3:10',
        verse: 'The LORD came and stood there, calling as at the other times, "Samuel! Samuel!" Then Samuel said, "Speak, for your servant is listening."',
        body: "Prayer is a two-way conversation. After we speak, we must learn to be still and hear what God is saying.",
      },
    ],
  },
  {
    id: 'grace',
    title: 'Grace',
    description: "Explore the depths of God's unmerited favor.",
    lessons: [
      {
        title: 'What Is Grace?',
        scripture: 'Romans 3:24',
        verse: '...and all are justified freely by his grace through the redemption that came by Christ Jesus.',
        body: "Grace is God's undeserved favor extended to humanity through Christ. We receive what we do not deserve and are spared what we do.",
      },
      {
        title: 'Grace vs. Law',
        scripture: 'Romans 6:14',
        verse: 'For sin shall no longer be your master, because you are not under the law, but under grace.',
        body: "We are freed from the law's condemnation and empowered by grace to live righteously — not to earn favor, but as a response to it.",
      },
      {
        title: 'Abounding Grace',
        scripture: 'Romans 5:20',
        verse: 'But where sin increased, grace increased all the more.',
        body: "No sin is greater than the grace of God. His grace always abounds more — it is never exhausted by our failure.",
      },
      {
        title: 'Grace in Suffering',
        scripture: '2 Corinthians 12:9',
        verse: 'But he said to me, "My grace is sufficient for you, for my power is made perfect in weakness."',
        body: "God's grace is most visible and powerful in our moments of weakness. Suffering is not the absence of grace — it is often its greatest display.",
      },
      {
        title: 'Growing in Grace',
        scripture: '2 Peter 3:18',
        verse: 'But grow in the grace and knowledge of our Lord and Savior Jesus Christ.',
        body: 'Spiritual maturity involves a continuous growth in understanding and experiencing grace — not just receiving it but reflecting it.',
      },
    ],
  },
  {
    id: 'identity',
    title: 'Identity in Christ',
    description: 'Discover who you are as a child of God.',
    lessons: [
      {
        title: 'Children of God',
        scripture: 'John 1:12',
        verse: 'Yet to all who did receive him, to those who believed in his name, he gave the right to become children of God.',
        body: 'Our primary identity is being children of the living God through faith in Christ — not what we do, but whose we are.',
      },
      {
        title: 'New Creation',
        scripture: '2 Corinthians 5:17',
        verse: 'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!',
        body: 'In Christ, we are entirely new. Our old identity is not reformed — it is replaced by a brand-new life.',
      },
      {
        title: 'Chosen and Loved',
        scripture: 'Ephesians 1:4',
        verse: 'For he chose us in him before the creation of the world to be holy and blameless in his sight.',
        body: "God chose us before the foundation of the world — our value isn't earned by performance but established by His choice.",
      },
      {
        title: 'Rooted and Built Up',
        scripture: 'Colossians 2:7',
        verse: '...rooted and built up in him, strengthened in the faith as you were taught, and overflowing with thankfulness.',
        body: 'Identity in Christ means being deeply rooted so external storms cannot uproot us. Our foundation determines our stability.',
      },
      {
        title: 'More Than Conquerors',
        scripture: 'Romans 8:37',
        verse: 'No, in all these things we are more than conquerors through him who loved us.',
        body: 'Our identity gives us authority and victory that goes beyond mere survival — we overcome because of who Christ is in us.',
      },
    ],
  },
  {
    id: 'warfare',
    title: 'Spiritual Warfare',
    description: 'Equip yourself with the full armor of God.',
    lessons: [
      {
        title: 'Know Your Enemy',
        scripture: '1 Peter 5:8',
        verse: 'Be sober-minded; be watchful. Your adversary the devil prowls around like a roaring lion, seeking someone to devour.',
        body: "Understanding the enemy's tactics is the first step to standing firm. A soldier who ignores their enemy is already vulnerable.",
      },
      {
        title: 'The Full Armor',
        scripture: 'Ephesians 6:11',
        verse: "Put on the full armor of God, so that you can take your stand against the devil's schemes.",
        body: "God has provided everything we need for spiritual battle. Each piece of armor corresponds to a spiritual reality we must walk in daily.",
      },
      {
        title: 'Wielding the Word',
        scripture: 'Hebrews 4:12',
        verse: 'For the word of God is alive and active. Sharper than any double-edged sword, it penetrates even to dividing soul and spirit.',
        body: 'Scripture is our primary offensive weapon against spiritual attack. Jesus himself used the Word to resist the devil in the wilderness.',
      },
      {
        title: 'Pulling Down Strongholds',
        scripture: '2 Corinthians 10:4',
        verse: 'The weapons we fight with are not the weapons of the world. On the contrary, they have divine power to demolish strongholds.',
        body: "Spiritual strongholds are thought patterns aligned against God's truth. They can be demolished by the truth of the Word and prayer.",
      },
      {
        title: 'Overcoming by the Word',
        scripture: 'Revelation 12:11',
        verse: 'They triumphed over him by the blood of the Lamb and by the word of their testimony.',
        body: 'Victory in spiritual warfare is through two things: the blood of Christ and the bold declaration of what He has done.',
      },
    ],
  },
];
