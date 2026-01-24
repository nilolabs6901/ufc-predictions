import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Real odds from The Odds API for tonight's UFC 324 card
const oddsMap: Record<string, { fighterAOdds: number; fighterBOdds: number }> = {
  // Main event: Gaethje vs Pimblett
  'justin gaethje_paddy pimblett': { fighterAOdds: 200, fighterBOdds: -240 },
  'paddy pimblett_justin gaethje': { fighterAOdds: -240, fighterBOdds: 200 },

  // Co-main: O'Malley vs Song
  "sean o'malley_song yadong": { fighterAOdds: -210, fighterBOdds: 175 },
  'song yadong_sean omalley': { fighterAOdds: 175, fighterBOdds: -210 },

  // Umar vs Figueiredo
  'umar nurmagomedov_deiveson figueiredo': { fighterAOdds: -1500, fighterBOdds: 850 },
  'deiveson figueiredo_umar nurmagomedov': { fighterAOdds: 850, fighterBOdds: -1500 },

  // Rose vs Natalia
  'rose namajunas_natalia silva': { fighterAOdds: 260, fighterBOdds: -320 },
  'natalia silva_rose namajunas': { fighterAOdds: -320, fighterBOdds: 260 },

  // Lewis vs Waldo
  'derrick lewis_waldo cortes-acosta': { fighterAOdds: 265, fighterBOdds: -330 },
  'derrick lewis_waldo cortes acosta': { fighterAOdds: 265, fighterBOdds: -330 },
  'waldo cortes-acosta_derrick lewis': { fighterAOdds: -330, fighterBOdds: 265 },
  'waldo cortes acosta_derrick lewis': { fighterAOdds: -330, fighterBOdds: 265 },

  // Allen vs Jean Silva
  'arnold allen_jean silva': { fighterAOdds: 200, fighterBOdds: -245 },
  'jean silva_arnold allen': { fighterAOdds: -245, fighterBOdds: 200 },

  // Gautier vs Pulyaev
  'ateba gautier_andrey pulyaev': { fighterAOdds: -950, fighterBOdds: 650 },
  'andrey pulyaev_ateba gautier': { fighterAOdds: 650, fighterBOdds: -950 },

  // Krylov vs Bukauskas
  'nikita krylov_modestas bukauskas': { fighterAOdds: 115, fighterBOdds: -138 },
  'modestas bukauskas_nikita krylov': { fighterAOdds: -138, fighterBOdds: 115 },

  // Perez vs Johnson
  'alex perez_charles johnson': { fighterAOdds: 142, fighterBOdds: -168 },
  'charles johnson_alex perez': { fighterAOdds: -168, fighterBOdds: 142 },

  // Hokit vs Freeman
  'josh hokit_denzel freeman': { fighterAOdds: -255, fighterBOdds: 205 },
  'denzel freeman_josh hokit': { fighterAOdds: 205, fighterBOdds: -255 },
};

async function main() {
  const fights = await prisma.fight.findMany({
    include: {
      fighterA: true,
      fighterB: true,
    },
    where: {
      event: {
        name: { contains: 'UFC 324' }
      }
    }
  });

  console.log(`Updating odds for ${fights.length} fights...`);

  for (const fight of fights) {
    const key = `${fight.fighterA.name.toLowerCase()}_${fight.fighterB.name.toLowerCase()}`;
    const odds = oddsMap[key];

    if (odds) {
      await prisma.fight.update({
        where: { id: fight.id },
        data: {
          fighterAOdds: odds.fighterAOdds,
          fighterBOdds: odds.fighterBOdds,
          openingAOdds: fight.openingAOdds ?? odds.fighterAOdds,
          openingBOdds: fight.openingBOdds ?? odds.fighterBOdds,
        }
      });
      console.log(`Updated: ${fight.fighterA.name} (${odds.fighterAOdds}) vs ${fight.fighterB.name} (${odds.fighterBOdds})`);
    } else {
      // Try partial matching
      const aName = fight.fighterA.name.toLowerCase();
      const bName = fight.fighterB.name.toLowerCase();

      let matched = false;
      for (const [mapKey, mapOdds] of Object.entries(oddsMap)) {
        const [mapA, mapB] = mapKey.split('_');
        if ((aName.includes(mapA.split(' ').pop()!) || mapA.includes(aName.split(' ').pop()!)) &&
            (bName.includes(mapB.split(' ').pop()!) || mapB.includes(bName.split(' ').pop()!))) {
          await prisma.fight.update({
            where: { id: fight.id },
            data: {
              fighterAOdds: mapOdds.fighterAOdds,
              fighterBOdds: mapOdds.fighterBOdds,
              openingAOdds: fight.openingAOdds ?? mapOdds.fighterAOdds,
              openingBOdds: fight.openingBOdds ?? mapOdds.fighterBOdds,
            }
          });
          console.log(`Updated (partial): ${fight.fighterA.name} (${mapOdds.fighterAOdds}) vs ${fight.fighterB.name} (${mapOdds.fighterBOdds})`);
          matched = true;
          break;
        }
      }

      if (!matched) {
        console.log(`No odds found for: ${fight.fighterA.name} vs ${fight.fighterB.name}`);
      }
    }
  }

  console.log('\nDone!');
  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
