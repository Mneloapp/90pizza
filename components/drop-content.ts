export type DropLanguage = "ge" | "en";

export const dropFlavors = [
  {
    id: "pepperoni",
    texture: "/images/square-drop/pepperoni.webp",
    accent: "#e01010",
    code: "RED SIDE",
  },
  {
    id: "four-cheese",
    texture: "/images/square-drop/four-cheese.webp",
    accent: "#e9c554",
    code: "WHITE SIDE",
  },
  {
    id: "margherita",
    texture: "/images/square-drop/margherita.webp",
    accent: "#9bba78",
    code: "GREEN SIDE",
  },
  {
    id: "mushroom",
    texture: "/images/square-drop/mushroom.webp",
    accent: "#b98252",
    code: "EARTH SIDE",
  },
] as const;

export const dropCopy = {
  ge: {
    home: "90pizza მთავარი",
    language: "ენის არჩევა",
    close: "დახურვა",
    openMenu: "ნავიგაციის გახსნა",
    nav: { flavors: "გემოები", idea: "იდეა", delivery: "მიტანა" },
    order: "ჩემი არჩევანი",
    soon: "მალე",
    discover: "აირჩიე შენი გემო",
    selected: "არჩეულია",
    hero: {
      edition: "ყველა კარგი რამ კვადრატში იწყება.",
      title: "პიცა სწორი კუთხით.",
      description:
        "30×30 სმ გემო. 9 თანაბარი ნაჭერი. ერთი ყუთი, რომლის გახსნაც გიხარია.",
      label: "შენი საღამოს მთავარი მომენტი",
      open: "ყუთის გახსნა",
      shut: "ყუთის დახურვა",
      model: "წითელი 90pizza-ს ყუთი კვადრატული პიცით",
      scroll: "სხვა კუთხით შეხედე",
    },
    manifesto: {
      eyebrow: "ფორმა შეიცვალა. მადა გაიზარდა.",
      title: "მრგვალი წესების\nკვადრატული პასუხი.",
      body: "ხრაშუნა კუთხეები. ტოპინგები კიდიდან კიდემდე. და ცხრა ნაჭერი, რომელიც ყოველთვის თანაბრად ნაწილდება.",
      words: ["სწორი კუთხე", "სანტიმეტრი გემო", "თანაბარი ნაჭერი"],
    },
    tasting: {
      eyebrow: "გემოებს შორის შენი ადგილია",
      title: "რომელ მხარეს ხარ?",
      small: "ერთი კვადრატი. ოთხი ხასიათი.",
      expand: "ნაჭრების გაშლა",
      join: "ნაჭრების შეკვრა",
      previous: "წინა გემო",
      next: "შემდეგი გემო",
      select: "ეს ჩემი გემოა",
      detail: "ინგრედიენტები",
      image: "არჩეული ოთხკუთხედი პიცის 3D მოდელი",
      items: [
        {
          name: "პეპერონი",
          line: "პირველი ნაჭრიდან გიყვარდება.",
          description:
            "პეპერონი, მოცარელა, პომიდვრის სოუსი და ჩილის თაფლი. ცოტა სითამამე ყველა კუთხეში.",
          tags: ["პეპერონი", "მოცარელა", "ჩილის თაფლი"],
        },
        {
          name: "ოთხი ყველი",
          line: "ოთხჯერ უფრო რთულია გაჩერება.",
          description:
            "მოცარელა, რიკოტა, გორგონზოლა და პარმეზანი. ოქროსფერი ზედაპირის ქვეშ ნამდვილი ყველის ამბავია.",
          tags: ["ოთხი ყველი", "კრემოვანი", "უხორცო"],
        },
        {
          name: "მარგარიტა",
          line: "კლასიკა, თავისი ახალი კუთხით.",
          description:
            "პომიდორი, ფიორ დი ლატე და ბაზილიკი. ცოტა ინგრედიენტი, ბევრი ხასიათი.",
          tags: ["პომიდორი", "ბაზილიკი", "უხორცო"],
        },
        {
          name: "სოკო",
          line: "კარგი გემო ხმაურის გარეშე.",
          description:
            "შემწვარი სოკო, შებოლილი სკამორცა, ნივრის კრემი და ბეგქონდარა. სიღრმე ყველა ნაჭერში.",
          tags: ["სოკო", "სკამორცა", "უხორცო"],
        },
      ],
    },
    sharing: {
      eyebrow: "ზუსტად 3×3",
      title: "ცხრა ნაჭერი.\nნულოვანი დილემა.",
      body: "შენი კუთხე შენ გელოდება. დანარჩენი რვა? გადაწყვიტე, ვის გაუზიარებ.",
      unit: "თანაბარი ნაჭერი",
      split: "გაყოფა",
      together: "შეკვრა",
      photo: "ერთი კვადრატული პიცა ცხრა თანაბარ ნაწილად",
    },
    delivery: {
      eyebrow: "კარგი საღამო გზაშია",
      title: "შენი მისამართი.\nჩვენი სწორი კუთხე.",
      body: "მთელი ეს გემო შენამდე მოსასვლელად შეიქმნა.",
      status: "მალე შენს საყვარელ აპში",
      launch: "Wolt-სა და Glovo-ზე შეკვეთები მალე გაიხსნება.",
      cta: "გემოს არჩევა",
      route: ["ღუმელიდან", "ყუთში", "შენთან"],
    },
    basket: {
      title: "შენი კვადრატი.",
      quantity: "რაოდენობა",
      less: "ერთით ნაკლები",
      more: "ერთით მეტი",
      size: "30×30 სმ",
      slices: "9 ნაჭერი თითო პიცაში",
      change: "გემოს შეცვლა",
      availability: "შეკვეთა მალე იქნება შესაძლებელი",
      note: "ეს შენი არჩევანის წინასწარი ნახვაა. გადახდა და შეკვეთების მიღება ჯერ არ ჩართულა.",
    },
    footer: {
      top: "დაბრუნება ზემოთ",
      message: "კუთხე სწორი გვაქვს.\nგემო შენ აირჩიე.",
      copyright: "ყველა კუთხე დაცულია.",
      social: "Instagram მალე",
    },
  },
  en: {
    home: "90pizza home",
    language: "Choose language",
    close: "Close",
    openMenu: "Open navigation",
    nav: { flavors: "Flavors", idea: "The idea", delivery: "Delivery" },
    order: "My square",
    soon: "Coming soon",
    discover: "Find your flavor",
    selected: "Selected",
    hero: {
      edition: "All good things start with a square.",
      title: "Pizza at the right angle.",
      description:
        "30×30 cm of flavor. 9 equal slices. One box you cannot wait to open.",
      label: "The main event of your evening",
      open: "Open the box",
      shut: "Close the box",
      model: "A red 90pizza delivery box with square pizza",
      scroll: "Look at it from a new angle",
    },
    manifesto: {
      eyebrow: "New shape. Bigger appetite.",
      title: "A square answer\nto round rules.",
      body: "Crisp corners. Toppings from edge to edge. And nine slices that always share equally.",
      words: ["right angle", "centimeters of flavor", "equal slices"],
    },
    tasting: {
      eyebrow: "There is a side for everyone",
      title: "Which side are you on?",
      small: "One square. Four personalities.",
      expand: "Separate the slices",
      join: "Bring the slices together",
      previous: "Previous flavor",
      next: "Next flavor",
      select: "This is my flavor",
      detail: "Ingredients",
      image: "3D model of the selected square pizza",
      items: [
        {
          name: "Pepperoni",
          line: "Love at first corner.",
          description:
            "Pepperoni, mozzarella, tomato sauce, and chili honey. A little boldness in every corner.",
          tags: ["Pepperoni", "Mozzarella", "Chili honey"],
        },
        {
          name: "Four cheese",
          line: "Four times harder to stop.",
          description:
            "Mozzarella, ricotta, gorgonzola, and parmesan. A real cheese story under a golden surface.",
          tags: ["Four cheeses", "Creamy", "Meat-free"],
        },
        {
          name: "Margherita",
          line: "The classic. A new angle.",
          description:
            "Tomato, fior di latte, and basil. Fewer ingredients. More character.",
          tags: ["Tomato", "Basil", "Meat-free"],
        },
        {
          name: "Mushroom",
          line: "Quietly unforgettable.",
          description:
            "Roasted mushrooms, smoked scamorza, garlic cream, and thyme. Depth in every slice.",
          tags: ["Mushrooms", "Scamorza", "Meat-free"],
        },
      ],
    },
    sharing: {
      eyebrow: "Precisely 3×3",
      title: "Nine slices.\nZero dilemmas.",
      body: "Your corner is waiting. The other eight? You decide who gets one.",
      unit: "equal slices",
      split: "Separate",
      together: "Together",
      photo: "A square pizza divided into nine equal parts",
    },
    delivery: {
      eyebrow: "A good evening is on its way",
      title: "Your address.\nOur right angle.",
      body: "All this flavor was made to come to you.",
      status: "Soon in your favorite app",
      launch: "Ordering on Wolt and Glovo is coming soon.",
      cta: "Choose your flavor",
      route: ["Out of the oven", "Into the box", "To your door"],
    },
    basket: {
      title: "Your square.",
      quantity: "Quantity",
      less: "One less",
      more: "One more",
      size: "30×30 cm",
      slices: "9 slices per pizza",
      change: "Change flavor",
      availability: "Ordering is coming soon",
      note: "This is a preview of your selection. Payments and live orders are not enabled yet.",
    },
    footer: {
      top: "Back to top",
      message: "We have the angle.\nYou choose the flavor.",
      copyright: "All corners reserved.",
      social: "Instagram coming soon",
    },
  },
};

export type DropText = (typeof dropCopy)[DropLanguage];
