import * as slash from "https://code.harmony.rocks/v2.0.0/deploy";

// Pick up TOKEN and PUBLIC_KEY from ENV.
slash.init({ env: true });

const ACTIVITIES: {
  [name: string]: {
    id: string;
    name: string;
  };
} = {
  poker: {
    id: "755827207812677713",
    name: "Poker Night",
  },
  betrayal: {
    id: "773336526917861400",
    name: "Betrayal.io",
  },
  fishing: {
    id: "814288819477020702",
    name: "Fishington.io",
  },
  chess: {
    id: "832012774040141894",
    name: "Chess in the Park",
  },
  watchTogether: {
    id: "880218394199220334",
    name: "Watch Together",
  },
  doodleCrew: {
    id: "878067389634314250",
    name: "Doodle Crew",
  },
  ocho: {
    id: "832025144389533716",
    name: "Ocho (Requirido Level 1, 2 Boosts)",
  },
  letterTile: {
    id: "879863686565621790",
    name: "Letter Tile",
  },
  wordSnacks: {
    id: "879863976006127627",
    name: "Word Snacks",
  },
  landIo: {
    id: "903769130790969345",
    name: "Land-io (Requirido Level 1, 2 Boosts)",
  },
};

const commands = [
   {
     name: "invite",
     description: "Me convide.",
   },
   {
     name: "changelog",
     description: "Veja o que mudou"
   },
   {
     name: "activity",
     description: "Iniciar uma atividade em um canal de voz.",
     options: [
      {
        name: "channel",
        type: "CHANNEL",
        description: "Canal de voz para iniciar.",
        required: true,
      },
      {
        name: "activity",
        type: "STRING",
        description: "Atividade para iniciar.",
        required: true,
        choices: Object.entries(ACTIVITIES).map((e) => ({
          name: e[1].name,
          value: e[0],
        })),
      },
    ],
  },
];

// Create Slash Commands if not present
slash.commands.all().then((e) => {
  let cmd;
  if (
    e.size !== commands.length || 
    !(cmd = e.find(e => e.name === "activity")) 
    || cmd?.options[1]?.choices?.length !== Object.keys(ACTIVITIES)
    || cmd.options[1].choices.some(e => ACTIVITIES[e.value] !== e.name)
  ) {
    slash.commands.bulkEdit(commands);
  }
});

slash.handle("activity", (d) => {
  if (!d.guild) return;
  const channel = d.option<slash.InteractionChannel>("channel");
  const activity = ACTIVITIES[d.option<string>("activity")];
  if (!channel || !activity) return;
  
  if (channel.type !== slash.ChannelTypes.GUILD_VOICE) {
    return d.reply("Atividades podem somente ser iniciadas em canais de voz!", {
      ephemeral: true,
    });
  }

  // POST /channels/{channel.id}/invites
  // with target_type: 2,
  // and target_appliation_id: app_id of activity
  
  // Wanna curl?
  /* 
     curl -X POST \
       -H "Authorization: Bot $TOKEN" \
       -H "Content-Type: application/json" \
       https://discord.com/api/v9/channels/$CHANNEL_ID/invites \
       -d "{ \"max_age\": 604800, \"max_uses\": 0, \"target_type\": 2, \"target_application_id\": \"$APP_ID\", \"temporary\": false }"
  */
  return slash.client.rest.api.channels[channel.id].invites
    .post({
      max_age: 604800,
      max_uses: 0,
      target_application_id: activity.id,
      target_type: 2,
      temporary: false,
    })
    .then((inv) => {
      return d.reply(
        `[Pressione aqui para iniciar ${activity.name} em ${channel.name}.](<https://discord.gg/${inv.code}>)`
      );
    })
    .catch((e) => {
      console.error("Starting Activity Failed", e);
      return d.reply("Falhei ao tentar iniciar atividade.", { ephemeral: true });
    });
});

slash.handle("invite", (d) => {
  return d.reply(
    `• [Clique aqui para me convidar.](<https://discord.com/api/oauth2/authorize?client_id=706885261694337117&permissions=1&scope=applications.commands%20bot>)`,
    { ephemeral: true },
  );
});

slash.handle("changelog", (d) => {
  return d.reply(
    `• Adicionado mais 2 Jogos (8s Ocho e Land-io)
     • Adicionado Changelog
     • Removido antigo Watch Together (YouTube Together)
     • Removido Herobrine`,
     { ephemeral: true },
  );
});

// Handle for any other commands received.
slash.handle("*", (d) => d.reply("Unhandled Command", { ephemeral: true }));
// Log all errors.
slash.client.on("interactionError", console.error);