/**
 * Hand-picked outlines for Parks that `scripts/park-outlines.ts` cannot place
 * on its own, or places wrong. Each entry names the layer and the feature
 * ids to fetch by id, with no point search and no growth: `scripts/
 * park-outlines.ts` never overwrites a picked Park from its own search, and
 * marks its outline `source.picked: true`.
 *
 * A pick may also give `clip`, a ring of [longitude, latitude] points: the
 * outline is then only the part of its parcels inside that ring. Use it when
 * one parcel holds two Parks.
 *
 * `NO_OUTLINE` records the Parks a person decided can have no outline, with
 * the reason; the report prints it.
 *
 * Key: the Park page's URL. Add an entry, then rerun `bun scripts/
 * park-outlines.ts`.
 */
type Ring = [number, number][];

/**
 * Slater Creek through the Badgerow Park land in Greece, from OpenStreetMap
 * (ways 792683615 to 792683057, fetched 2026-09-27), simplified to about 2 m.
 * It divides the common area between Veteran's Memorial Park and Badgerow
 * Park South.
 */
const SLATER_CREEK: Ring = [
  [-77.657028, 43.249104],
  [-77.656865, 43.249229],
  [-77.656557, 43.249588],
  [-77.656059, 43.249923],
  [-77.655979, 43.250064],
  [-77.655804, 43.250171],
  [-77.655722, 43.250351],
  [-77.654696, 43.25059],
  [-77.654258, 43.250618],
  [-77.652949, 43.25111],
  [-77.652654, 43.251401],
  [-77.652583, 43.251689],
  [-77.652509, 43.251746],
  [-77.652353, 43.251787],
  [-77.65214, 43.251926],
  [-77.652011, 43.251915],
  [-77.650565, 43.251418],
  [-77.650287, 43.251374],
  [-77.650145, 43.251388],
  [-77.649386, 43.251871],
  [-77.648438, 43.252609],
  [-77.648181, 43.252734],
  [-77.648049, 43.252962],
  [-77.648047, 43.253054],
  [-77.64789, 43.253262],
  [-77.647832, 43.253547],
  [-77.647541, 43.253743],
  [-77.647409, 43.253932],
  [-77.6473, 43.253987],
  [-77.64695, 43.25406],
  [-77.6468, 43.25416],
  [-77.646414, 43.254273],
  [-77.645858, 43.254629],
  [-77.645106, 43.255178],
  [-77.644097, 43.256396],
  [-77.643731, 43.256741],
  [-77.643108, 43.257232],
  [-77.642214, 43.257712],
  [-77.642062, 43.258135],
  [-77.641987, 43.258569],
  [-77.641659, 43.2591],
  [-77.641578, 43.259541],
  [-77.641158, 43.260311],
  [-77.641017, 43.260426],
  [-77.641088, 43.260522],
  [-77.640948, 43.260655],
  [-77.640934, 43.260779],
  [-77.640746, 43.260973],
  [-77.640522, 43.261075],
  [-77.640301, 43.26156],
  [-77.640136, 43.261685],
  [-77.639509, 43.261835],
  [-77.639343, 43.26191],
  [-77.63919, 43.262094],
  [-77.639087, 43.262153],
  [-77.638886, 43.262167],
  [-77.638641, 43.262108],
  [-77.638499, 43.262293],
  [-77.638378, 43.262316],
  [-77.638117, 43.262268],
  [-77.637935, 43.262328],
  [-77.637788, 43.262482],
  [-77.637542, 43.262516],
  [-77.637263, 43.262683],
  [-77.637151, 43.262777],
  [-77.636972, 43.263124],
  [-77.637012, 43.263436],
  [-77.63716, 43.263604],
  [-77.637213, 43.263725],
  [-77.637219, 43.263815],
  [-77.637088, 43.263927],
  [-77.636948, 43.263963],
  [-77.635901, 43.263953],
];

/** The land on one side of a line that crosses a Park's parcels. */
function sideOf(line: Ring, side: 'west' | 'east'): Ring {
  const [start, end] = [line[0], line[line.length - 1]];
  const [south, north] = [start[1] - 0.01, end[1] + 0.01];
  const far = side === 'west' ? start[0] - 0.01 : end[0] + 0.01;
  return [
    [start[0], south],
    ...line,
    [end[0], north],
    [far, north],
    [far, south],
    [start[0], south],
  ];
}

export const PICKS: Record<
  string,
  {
    layer: 'county parks' | 'county parcels' | 'city parcels';
    ids: string[];
    clip?: Ring;
  }
> = {
  /**
   * Owner name is the Park ("City Of Roch Aberdeen Pk"), acres and address
   * match.
   */
  '/rochester-city-parks/aberdeen-square-park/': {
    layer: 'city parcels',
    ids: ['12072000020490000000'],
  },
  /**
   * City-owned vacant lot, 0.31 of 0.4 ac. The only City parcel at Union and
   * University.
   */
  '/rochester-city-parks/anderson-park/': {
    layer: 'city parcels',
    ids: ['10682000010490000000'],
  },
  /**
   * The riverside green west of the Main St Bridge is the county's class 590
   * Park parcel at 47-59 Main St (0.43 ac), with the 0.02 ac park sliver at 41
   * Main St beside it. The old outline held only the sliver; the larger parcel
   * is not in the City-owned layer.
   */
  '/rochester-city-parks/aqueduct-park/': {
    layer: 'county parcels',
    ids: ['26140012123000010240020000', '26140012123000010240030000'],
  },
  /**
   * The plaza is the roof of the City's Genesee Crossroads parking garage
   * (69 Andrews St, class 437), and the garage parcel traces the plaza
   * exactly on the aerial, so the parcel is the outline.
   */
  '/rochester-city-parks/austin-steward-plaza/': {
    layer: 'city parcels',
    ids: ['10679000010650000000'],
  },
  /**
   * The pocket park is the City's class 590 Park parcel at 105 Barrington St
   * (0.22 ac); the aerial shows the whole lawn on it. The page's 1 ac is the
   * City park layer's rounded figure.
   */
  '/rochester-city-parks/barrington-street-park/': {
    layer: 'city parcels',
    ids: ['12144000020410000000'],
  },
  /**
   * Address matches (65 Brewster Rd), 3.38 of 4 ac.
   */
  '/rochester-city-parks/brewster-harding-park/': {
    layer: 'city parcels',
    ids: ['07621000010940000000'],
  },
  /**
   * Address matches (37 Merchants Rd), acres match.
   */
  '/rochester-city-parks/browncroft-rose-garden-park/': {
    layer: 'city parcels',
    ids: ['10783000010340000000'],
  },
  /**
   * 4.36 of 4.6 ac, City-owned, at Latta Rd.
   */
  '/rochester-city-parks/charlotte-village-green/': {
    layer: 'city parcels',
    ids: ['04762000010010000000'],
  },
  /**
   * Owner name is the Park ("Cobbs Hill Reserv"), 104 of 109 ac. The reservoir
   * is inside the Park.
   */
  '/rochester-city-parks/cobbs-hill-park-and-washington-grove/': {
    layer: 'city parcels',
    ids: ['12270000010010000000'],
  },
  /**
   * The City's class 590 Park parcel at 67-71 Stone St (0.30 ac) is the lawn
   * at Stone St and Broad St. The old point sat on the parcel edge in the
   * street.
   */
  '/rochester-city-parks/cornerstone-park/': {
    layer: 'city parcels',
    ids: ['12123000020290000000'],
  },
  /**
   * 31.7 of 30.9 ac. ADR-0009 already treats the grounds around the R-Center
   * as the Park.
   */
  '/rochester-city-parks/edgerton-park/': {
    layer: 'city parcels',
    ids: ['10542000010870010000'],
  },
  /**
   * The City page puts the park on the east bank from Andrews St to the Sister
   * Cities Bridge and Bragdon Place; that strip is the City's class 963
   * Municipal Park parcel at 65 N Water St (0.81 ac). The old point was on the
   * west-bank garage under Austin Steward Plaza.
   */
  '/rochester-city-parks/genesee-crossroads-park/': {
    layer: 'city parcels',
    ids: ['10679000010630000000'],
  },
  /**
   * The current nine City class 590 Park parcels are right: the riverside
   * strip at 600 Ford St, the court and playground at 171-191 Mt Hope Ave and
   * the lawns at Mt Hope Ave and Ford St. They come to 11.9 ac, the page's 12.
   */
  '/rochester-city-parks/genesee-gateway-park/': {
    layer: 'city parcels',
    ids: [
      '12155000010010000000',
      '12155000010550010000',
      '12155000010560000000',
      '12155000010570000000',
      '12155000010580000000',
      '12155000010600010000',
      '12162000010330000000',
      '12162000010340000000',
      '12162000010350000000',
    ],
  },
  /**
   * The three City parcels on the west rim of the gorge from Driving Park Ave
   * down past the Lower Falls (50 and 158 Hastings St, class 963 Municipal
   * Park, and 190 Hastings St) come to 5.23 ac, the page's 5.2 ac. The old
   * point was 170 m south, on a utility parcel by the dam.
   */
  '/rochester-city-parks/lower-falls-park/': {
    layer: 'city parcels',
    ids: [
      '10528000020020000000',
      '10528000020010000000',
      '09083000020160000000',
    ],
  },
  /**
   * The west-bank gorge park from Driving Park Ave north to the Kodak
   * treatment plant: 264 Maplewood Ave (class 590 Park, 50.3 ac), 350
   * Maplewood Dr with the pond (class 963, 31.0 ac), the Rose Garden at 250
   * Maplewood Ave (class 593, 6.8 ac) and the park drive between them (1.3
   * ac). 89 ac against the page's 110; the east bank is Seneca Park land.
   */
  '/rochester-city-parks/maplewood-park-and-rose-garden/': {
    layer: 'city parcels',
    ids: [
      '09129000010010000000',
      '09068000010020000000',
      '09083000010130000000',
      '09083000010580000000',
    ],
  },
  /**
   * City-owned vacant lot at 184 Culver Rd, 0.10 ac. The page has no acres to
   * check against.
   */
  '/rochester-city-parks/morrison-park/': {
    layer: 'city parcels',
    ids: ['12253000030280000000'],
  },
  /**
   * The two City class 591 Playground parcels (130 Orchard St, 200 Campbell
   * St) plus the City lot at 250 Campbell St, which holds the play structure
   * and spray area at the park's southwest corner. 3.58 ac against the page's
   * 3.7.
   */
  '/rochester-city-parks/orchard-playground/': {
    layer: 'city parcels',
    ids: [
      '12027000010030000000',
      '12027000010060010000',
      '12027000010700010000',
    ],
  },
  /**
   * Address matches (26 vs 25 Quamina Dr), acres match.
   */
  '/rochester-city-parks/quamina-park/': {
    layer: 'city parcels',
    ids: ['10639000030360000000'],
  },
  /**
   * City-owned, 0.38 of 0.3 ac, near Adams St.
   */
  '/rochester-city-parks/ralph-avery-mall/': {
    layer: 'city parcels',
    ids: ['12146000010290010000'],
  },
  /**
   * The ruined church and its tower stand on the county's class 960 Public
   * Park parcel at 118 Pleasant St (74 by 70 ft). The lawn west of it, where
   * the old point was, is on no parcel, so the outline is much smaller than
   * the page's 1.8 ac.
   */
  '/rochester-city-parks/st-josephs-park/': {
    layer: 'county parcels',
    ids: ['26140010680000010450000000'],
  },
  /**
   * Owner name is the Park, address and acres match.
   */
  '/rochester-city-parks/susan-b-anthony-square-park/': {
    layer: 'city parcels',
    ids: ['12036000010110000000'],
  },
  /**
   * The City's own vacant parcels at the Park's address (350 Boxart St), the
   * wooded bluff to Lake Ave, the Boxart St woods on the turning basin, the
   * boardwalk strip over the basin and Turning Point Park North up to the
   * Genesee Marina trail; all are City owned and zoned O-S Open Space. They
   * come to 129 ac; the City's 275 ac counts the turning basin water, which no
   * parcel holds (ADR-0003).
   */
  '/rochester-city-parks/turning-point-park/': {
    layer: 'city parcels',
    ids: [
      '07621000020020010000',
      '07621000020020020000',
      '06161000010010000000',
      '06161000010020000000',
      '06161000010030000000',
      '06161000010040000000',
      '06161000010050000000',
      '06161000010070000000',
      '06169000010030000000',
      '06169000010040000000',
      '06169000010050000000',
      '06169000010060000000',
      '06153000010230000000',
      '06145000010480000000',
      '06138000010010000000',
      '06130000010080030000',
    ],
  },
  /**
   * The playground is the City's class 591 Playground parcel at 750 University
   * Ave (0.40 ac); the aerial shows it fills the parcel. The page's 1 ac is
   * the City park layer's rounded figure.
   */
  '/rochester-city-parks/university-avenue-playground/': {
    layer: 'city parcels',
    ids: ['12128000030050000000'],
  },
  /**
   * City-owned, 0.77 of 0.8 ac, at Marshall St.
   */
  '/rochester-city-parks/wadsworth-square/': {
    layer: 'city parcels',
    ids: ['12140000020020000000'],
  },
  /**
   * The three tax-exempt lots of the Brighton Recreation subdivision are
   * certain: R-1A (26.54 ac, lodge, fields and courts), R-1B (5.46 ac, the
   * Buckland farmhouse) and Lot 2 (18.09 ac, the south ball diamonds, classed
   * house but exempt); 50.09 of the page's 93.28 acres (a park-database
   * figure). Left out as unresolved: the town's 43.69 acres at 1435 Westfall
   * Rd, which the farmers market names as a site apart from Buckland Park (its
   * barn has "additional parking a short walk away at Buckland Park"), and the
   * class-590 26.39-acre lot R-2A to the east, which no source ties to this
   * Park.
   */
  '/town-parks/brighton-parks/buckland-park/': {
    layer: 'county parcels',
    ids: [
      '26200013620000010221000000',
      '26200013620000010222000000',
      '26200014908000010021110000',
    ],
  },
  /**
   * 74.6 of 76.6 ac, on Crittenden Rd.
   */
  '/town-parks/brighton-parks/lynch-woods-park/': {
    layer: 'county parcels',
    ids: ['26200014815000030391000000'],
  },
  /**
   * 73.1 of 72 ac, on Elmwood Ave.
   */
  '/town-parks/brighton-parks/sandra-l-frankel-nature-park/': {
    layer: 'county parcels',
    ids: ['26200013616000020292100000'],
  },
  /**
   * The tax roll names the 14.58 ac parcel at 100 Kentucky Avenue 'Lions
   * Park'. This matches the page's 14 ac and holds the tennis courts and
   * playground. The old search also joined 160 Spencerport Road, which is
   * Memorial Park.
   */
  '/town-parks/gates-parks/lions-park/': {
    layer: 'county parcels',
    ids: ['26260010410000020020000000'],
  },
  /**
   * Memorial Park's outline also had Lions Park's parcel. It is only the 29.47
   * ac parcel at its own address, 160 Spencerport Road, which matches the
   * page's 30 ac.
   */
  '/town-parks/gates-parks/memorial-park/': {
    layer: 'county parcels',
    ids: ['26260010410000020031000000'],
  },
  /**
   * The town's land at Latta Road and Dewey Avenue is one block of three
   * parcels (66.3 ac) that holds two Parks and a common area of woods and
   * trails between them; no parcel line divides them. The town's figures
   * (33.1 and 33.2 ac) add up to the whole block. Slater Creek splits it:
   * Badgerow Park South takes the land east of the creek, with its ball
   * fields on Latta Road.
   */
  '/town-parks/greece-parks/badgerow-park-south/': {
    layer: 'county parcels',
    ids: [
      '26280004604000010120000000',
      '26280004604000010130000000',
      '26280004604000010140000000',
    ],
    clip: sideOf(SLATER_CREEK, 'east'),
  },
  /**
   * The Town of Greece runs 375 acres inside the state's Braddock Bay Wildlife
   * Management Area, but those acres are no tax parcel of their own: the land
   * is one 1,764-acre state parcel. The state land that the DEC does not map
   * as the WMA comes to 328 acres in five separate pieces, and only 58 of
   * them touch the page's point. This is the county parcel at the Park's own
   * address, 199 East Manitou Road: 84 of the 375 acres, certain but short.
   */
  '/town-parks/greece-parks/braddock-bay-park/': {
    layer: 'county parcels',
    ids: ['26280002504000040150000000'],
  },
  /**
   * The access drive, parking and east trails are on the tax-exempt 67.9 ac
   * parcel at the Park's address, 101 Hogan Point Road. The town's trail map
   * loops the west trails from the Hogan Point Road trailhead over the two
   * tax-exempt parcels at 111 and 113 Hogan Point Road (split by one deed; 113
   * is 37.65 ac, and the roll gives no acres for 111), so they are part of the
   * Park.
   */
  '/town-parks/greece-parks/burger-park/': {
    layer: 'county parcels',
    ids: [
      '26280002502000010021100000',
      '26280002501000020022000000',
      '26280002501000020023000000',
    ],
  },
  /**
   * Address matches (461 Bonesteel St), 9.6 of 9 ac.
   */
  '/town-parks/greece-parks/columbus-park/': {
    layer: 'county parcels',
    ids: ['26280007514000030400000000'],
  },
  /**
   * The tax roll names this 6.9 ac picnic-site parcel 'Henpeck Park'. The old
   * search also joined Greece Canal Park (565 ac) and other county park land.
   * The parking lot and boat launch beside it are on untaxed canal land in no
   * parcel.
   */
  '/town-parks/greece-parks/henpeck-park/': {
    layer: 'county parcels',
    ids: ['26280008804000010240000000'],
  },
  /**
   * The tax roll marks both parcels 'Town Rec': 43.6 ac at 3688 Latta Road and
   * 17.97 ac 'Rear Of 3688'. Together they are 61.6 of the page's 73.64 ac;
   * the rest is not found, and Firemen's Field next door belongs to the fire
   * district.
   */
  '/town-parks/greece-parks/klafehn-park/': {
    layer: 'county parcels',
    ids: ['26280004403000010011000000', '26280004401000020380000000'],
  },
  /**
   * The point is on the YMCA next door. The touching 593 Picnic-site parcel is
   * at the page address (732 Long Pond Rd): pick it. 10 of 16.7 ac.
   */
  '/town-parks/greece-parks/sawyer-park/': {
    layer: 'county parcels',
    ids: ['26280004503000040130000000'],
  },
  /**
   * The same block as Badgerow Park South: Veteran's Memorial Park takes the
   * land west of Slater Creek, with its fields, courts and parking on Dewey
   * Avenue.
   */
  '/town-parks/greece-parks/veterans-memorial-park/': {
    layer: 'county parcels',
    ids: [
      '26280004604000010120000000',
      '26280004604000010130000000',
      '26280004604000010140000000',
    ],
    clip: sideOf(SLATER_CREEK, 'west'),
  },
  /**
   * Address matches (1658 Lake Rd), acres match.
   */
  '/town-parks/hamlin-parks/hamlin-recreation-area/': {
    layer: 'county parcels',
    ids: ['26300002103000020363000000'],
  },
  /**
   * The DEC notice for Scout Park's 2023 work gives 4180 Brick Schoolhouse Rd,
   * the mowed 5.2-acre class-963 parcel with the pavilion; the tax-exempt
   * 9.36-acre wooded creek parcel beside it matches the page's 9.13 acres and
   * 4250 address. Both are the Park; the point moves to the mowed main area.
   */
  '/town-parks/hamlin-parks/scout-park/': {
    layer: 'county parcels',
    ids: ['26300001204000020082200000', '26300001204000020100000000'],
  },
  /**
   * The page puts the 30-acre Park between Victory Baptist Church, I-390 and
   * Wildbriar Road. The tax-exempt 30.1 ac wooded parcel behind the Wildbriar
   * Road houses fits all three. The old point was on a house lot.
   */
  '/town-parks/henrietta-parks/andrews-park/': {
    layer: 'county parcels',
    ids: ['26320016213000010031100000'],
  },
  /**
   * The tax-exempt 1 ac Playground parcel at 108 Belmanor Drive is an open
   * lawn, which matches the Park's one amenity, an open field. The old point
   * was on a storage lot in the office park next to it.
   */
  '/town-parks/henrietta-parks/belmanor-park/': {
    layer: 'county parcels',
    ids: ['26320016305000010010000000'],
  },
  /**
   * 98 of 90 ac, a government parcel on Calkins Rd.
   */
  '/town-parks/henrietta-parks/henrietta-veterans-memorial-park/': {
    layer: 'county parcels',
    ids: ['26320017605000010551100000'],
  },
  /**
   * Address and acres match exactly (19.49 ac). Class is golf course.
   */
  '/town-parks/henrietta-parks/lookup-park/': {
    layer: 'county parcels',
    ids: ['26320019005000010311000000'],
  },
  /**
   * The town says the hill is on Erie Station Road across from Windelin Drive.
   * The tax-exempt 9.54 ac lot there is the open space of the Erie Ridge
   * townhome subdivision (filed 2024) and holds the grassy slope. The town
   * page gives no size.
   */
  '/town-parks/henrietta-parks/sledding-hill/': {
    layer: 'county parcels',
    ids: ['26320018912000030774000000'],
  },
  /**
   * Address matches (1585 Calkins Rd), 69.5 of 68 ac.
   */
  '/town-parks/henrietta-parks/tinker-nature-park/': {
    layer: 'county parcels',
    ids: ['26320017705000010700000000'],
  },
  /**
   * The playground and lawn are on the tax-exempt 1.5 ac parcel at 361 Lake
   * Front. The tax-exempt 1.7 ac parcel with the same address holds the lawn
   * north of it, down to the beach.
   */
  '/town-parks/irondequoit-parks/bateau-play-area/': {
    layer: 'county parcels',
    ids: ['26340004765000020300000000', '26340004765000020060000000'],
  },
  /**
   * The playground is on 481 Cooper Road at the corner of Bristol Avenue. The
   * two wooded lots next to it (473 Cooper Road, 107 Bristol Avenue) are the
   * same subdivision's lots 43-45, tax-exempt, have the same value, and have
   * no houses; together they are 0.48 ac.
   */
  '/town-parks/irondequoit-parks/bristol-tot-lot/': {
    layer: 'county parcels',
    ids: [
      '26340007606000020420000000',
      '26340007606000020430000000',
      '26340007606000020440000000',
    ],
  },
  /**
   * 2.70 of 2.72 ac.
   */
  '/town-parks/irondequoit-parks/heyer-bayer-memorial-park/': {
    layer: 'county parcels',
    ids: ['26340007711000070311000000'],
  },
  /**
   * The tax-exempt 0.56 ac lot at 113 Pardee Road holds the playground; the
   * lots on each side have houses.
   */
  '/town-parks/irondequoit-parks/pardee-tot-lot/': {
    layer: 'county parcels',
    ids: ['26340010707000010240000000'],
  },
  /**
   * The playground is on the tax-exempt 0.19 ac lot on Wahl Road. The vacant
   * lots next to it are taxable, so they are private.
   */
  '/town-parks/irondequoit-parks/sadies-place/': {
    layer: 'county parcels',
    ids: ['26340009210000040371300000'],
  },
  /**
   * The tax-exempt 27.55-acre parcel on the north side of Semmel Road, about
   * 0.87 miles east of Quaker Meeting House Road as the town PDF says, holds
   * the soccer fields, parking and restroom building. The old point was on
   * Semmel Road; it now sits on the fields.
   */
  '/town-parks/mendon-parks/driesbach-fields/': {
    layer: 'county parcels',
    ids: ['26368922201000010041100000'],
  },
  /**
   * The tax-exempt 53.63-acre parcel on Clover St inside the great bend of the
   * old Lehigh Valley railroad, with mown walking paths, is the town's park;
   * the page's 88.52 acres is not matched by any exempt set nearby (ADR-0003),
   * and the 2.56-acre former Conrail strip and 38.79-acre Plains Rd parcel
   * have no evidence of being this park. The old point was on a private house
   * lot at 4559 Clover St.
   */
  '/town-parks/mendon-parks/great-bend-park/': {
    layer: 'county parcels',
    ids: ['26368922102000010041000000'],
  },
  /**
   * The touching 963 Municipal-park parcel is at the page address (23 N Main
   * St). Pick it with the 5.27 ac parcel under the point: 8.0 of 12.4 ac.
   */
  '/town-parks/mendon-parks/harry-allen-park/': {
    layer: 'county parcels',
    ids: ['26360122808000020121000000', '26360122812000010150000000'],
  },
  /**
   * The tax-exempt 15-acre village parcel on N Main St north of the cemetery
   * holds the soccer fields, pavilion, playground and parking that the village
   * page describes. The old point was on the sewage-plant and cemetery edge;
   * it now sits by the pavilion.
   */
  '/town-parks/mendon-parks/rotary-park/': {
    layer: 'county parcels',
    ids: ['26360122120000010010000000'],
  },
  /**
   * The current outline is right: the 79.32-acre class-963 parcel at 95 Semmel
   * Road matches the page's 79.08 acres and holds the ball field, tennis
   * courts and playground. The old point was on the town highway garage next
   * door; it now sits by the ball field.
   */
  '/town-parks/mendon-parks/semmel-road-park/': {
    layer: 'county parcels',
    ids: ['26368922201000010032000000'],
  },
  /**
   * The tax-exempt 0.43-acre village strip between W Main St and Honeoye
   * Creek, across from Norton St, is the only public land where the village
   * page puts the park (creek view, picnic tables); it is classed Parking lot
   * because its east end is a small lot. The old point was in the road edge;
   * it now sits on the strip.
   */
  '/town-parks/mendon-parks/vest-pocket-park/': {
    layer: 'county parcels',
    ids: ['26360122843000010540000000'],
  },
  /**
   * The 0.44 ac parcel at 416 Washington Street matches the address and acres
   * in Ogden's 2024 plan. The Canal Road park parcel, 375 m east, is Snick
   * Hawkins Park.
   */
  '/town-parks/ogden-parks/adams-basin-schoolhouse/': {
    layer: 'county parcels',
    ids: ['26388908502000030090000000'],
  },
  /**
   * Ogden gives Snick Hawkins Park as 0.28 ac on Canal Road, Adams Basin,
   * beside the canal. This 0.28 ac Municipal Park parcel on Canal Road in
   * Adams Basin ('Former Canal Parcel 1227A') matches all three. The old point
   * was in Spencerport, 4 km east.
   */
  '/town-parks/ogden-parks/snick-hawkins-park/': {
    layer: 'county parcels',
    ids: ['26388908601000020270000000'],
  },
  /**
   * The point is on the tax-exempt 0.28 ac lot at 20 Canal Street on the
   * Spencerport canal bank, next to the Union Street bridge. This matches the
   * page's 0.28 ac. The 0.28 ac Canal Road park parcel is Snick Hawkins Park
   * in Adams Basin, not this one.
   */
  '/town-parks/ogden-parks/towpath-park/': {
    layer: 'county parcels',
    ids: ['26380108709000060090000000'],
  },
  /**
   * Pick the parcel under the point and the touching 592 Athletic-field
   * parcel: 59.7 of 72.9 ac.
   */
  '/town-parks/parma-parks/parma-park/': {
    layer: 'county parcels',
    ids: ['26408904303000020180000000', '26408904303000020092000000'],
  },
  /**
   * The current parcels are right. The 1111 West Avenue parcel is 'Jennejahn
   * Park' (31.24 ac, the page's 30.86), and Jennejahn Lodge stands on the 1123
   * West Avenue park parcel next to it. The old point was on the school's
   * baseball field. The new point is at the lodge.
   */
  '/town-parks/parma-parks/village-park/': {
    layer: 'county parcels',
    ids: ['26400103209000040010000000', '26400103209000040410000000'],
  },
  /**
   * The town page calls the Park "this 19-acre parcel", which is the 19.1-acre
   * exempt parcel at 1717 Linear Park Dr with the pavilion and Parks office.
   * The 21-acre class-963 parcel east of Linear Park Dr (Paper Mill and
   * Lawless property, 2165 Washington St) is separate town land along the
   * Honey Creek Trail, not counted in the 19 acres.
   */
  '/town-parks/penfield-parks/channing-philbrick-park/': {
    layer: 'county parcels',
    ids: ['26420013909000010010000000'],
  },
  /**
   * Address matches (1862 Penfield Rd), 3.8 of 3.38 ac.
   */
  '/town-parks/penfield-parks/heritage-park/': {
    layer: 'county parcels',
    ids: ['26420013906000020421000000'],
  },
  /**
   * The assessor marks both parcels "p/o La Salle's Landing": the 0.23-acre
   * park lawn at 1080 Empire Blvd and the 1.4-acre shore and underwater strip
   * at 1086; 1.63 acres of the page's 2.11. The old point was on the marina
   * next door.
   */
  '/town-parks/penfield-parks/lasalles-landing-park/': {
    layer: 'county parcels',
    ids: ['26420010805000020020000000', '26420010805000020010000000'],
  },
  /**
   * Acres match exactly (1.80 ac). Class is sewage.
   */
  '/town-parks/penfield-parks/panorama-valley-park/': {
    layer: 'county parcels',
    ids: ['26420013808000010530000000'],
  },
  /**
   * The current outline is right: the 0.20-acre class-963 parcel at 1820
   * Penfield Rd is the green corner at the Four Corners with the Daniel
   * Penfield statue; the page's 0.06 acres is likely only the statue plaza.
   */
  '/town-parks/penfield-parks/schaufelberger-park/': {
    layer: 'county parcels',
    ids: ['26420013906000010351000000'],
  },
  /**
   * The four tax-exempt parcels of the old Shadow Pines golf course (1950
   * Clark Rd 105.3 ac, 295 Whalen Rd 53.1 ac, 745 Whalen Rd 47.6 ac, and the
   * Alpheus Clark House lot formerly 1960 Clark Rd 5.7 ac) total 211.7 acres
   * against the town's 212. The old point was on a church lot in a subdivision
   * 1 km north; it now sits on the new recreation area's courts.
   */
  '/town-parks/penfield-parks/shadow-pines-property/': {
    layer: 'county parcels',
    ids: [
      '26420012413000010021000000',
      '26420012409000010010000000',
      '26420012413000010040000000',
      '26420012413000010030000000',
    ],
  },
  /**
   * 76 of 82 ac.
   */
  '/town-parks/penfield-parks/sherwood-fields-park/': {
    layer: 'county parcels',
    ids: ['26420012504000010173200000'],
  },
  /**
   * The six tax-exempt town parcels between Atlantic Ave and Jackson Rd hold
   * the ball fields, amphitheater, memorial and lodge (the 18.8-acre parcel's
   * note reads amphitheater/vet memorial/4 baseball fields) and total 85.44
   * acres against the page's 85.55. The 28.9-acre parcel at 3100 Atlantic Ave
   * also holds Town Hall, but most of it is ball fields.
   */
  '/town-parks/penfield-parks/veterans-memorial-park/': {
    layer: 'county parcels',
    ids: [
      '26420010904000020110000000',
      '26420010904000020082000000',
      '26420010904000020072000000',
      '26420011003000010280000000',
      '26420010904000020061000000',
      '26420010904000020031040000',
    ],
  },
  /**
   * The launch's trailer parking and lawn are on two town Municipal Park
   * parcels, 426 Ayrault Rd (0.7 ac, the page's address and acres) and 434
   * Ayrault Rd (0.5 ac); the ramp itself is on canal land with no tax parcel.
   * The old point sat on a condo building across the canal, so it moves to the
   * parking lot.
   */
  '/town-parks/perinton-parks/ayrault-boat-launch/': {
    layer: 'county parcels',
    ids: ['26448916511000030540000000', '26448916511000030530000000'],
  },
  /**
   * 1160 Ayrault Rd (26.6 ac, Municipal Park) is the soccer fields, restroom
   * and parking east of the Trolley Trail on the town's Center Park sheet. The
   * field to the north is in a 36.37 ac parcel (1334 Turk Hill Rd) that also
   * holds the Community Center's lot and woods west of the trail, so it is
   * left out. The old outline had Egypt Park's parcel in it, and the old point
   * was west of the trail on Center Park West.
   */
  '/town-parks/perinton-parks/center-park-east/': {
    layer: 'county parcels',
    ids: ['26448916610000010030000000'],
  },
  /**
   * 1350 Turk Hill Rd (47.69 ac, class Govt bldgs) holds the Community Center,
   * amphitheater, playground and soccer fields west of the Trolley Trail,
   * close to the page's 49 ac. 1160 Ayrault Rd is Center Park East, east of
   * the trail, and the 43.2 ac Old Trolley Rte parcel is the RS&E Trolley
   * Trail corridor, so neither one is part of this Park.
   */
  '/town-parks/perinton-parks/center-park-west/': {
    layer: 'county parcels',
    ids: ['26448916610000010041000000'],
  },
  /**
   * Acres match exactly (56.40 ac), on Turk Hill Rd.
   */
  '/town-parks/perinton-parks/dewitt-property/': {
    layer: 'county parcels',
    ids: ['26448918001000010152000000'],
  },
  /**
   * Lots 1 and 2 of the Lollypop Farm subdivision at Route 31 and Victor Rd
   * (7.33 + 7.36 ac, lot 1 described as "Egypt Park") match the town's Egypt
   * Park sheet and the page's 15.31 ac. The old outline also took in Center
   * Park East land and the Trolley Trail corridor.
   */
  '/town-parks/perinton-parks/egypt-park/': {
    layer: 'county parcels',
    ids: ['26448918101000010790000000', '26448918101000010780000000'],
  },
  /**
   * 11.5 of 10 ac, on Moseley Rd.
   */
  '/town-parks/perinton-parks/harts-woods/': {
    layer: 'county parcels',
    ids: ['26448916508000010080000000'],
  },
  /**
   * Acres match exactly (73.5 ac), on Garnsey Rd.
   */
  '/town-parks/perinton-parks/horizon-hill/': {
    layer: 'county parcels',
    ids: ['26448917904000010060000000'],
  },
  /**
   * Thirteen tax-exempt parcels between Whitney Rd E, Wakeman Rd and Macedon
   * Center Rd fill the outline on the town's Howell Road Park sheet (Park Plan
   * 2019, appendix A), on both sides of Howell Rd. They come to 205 ac of the
   * sheet's 208.6 ac; one is 202 Howell Rd, whose deed description reads
   * "Howell Road Park".
   */
  '/town-parks/perinton-parks/howell-road-park/': {
    layer: 'county parcels',
    ids: [
      '26448915401000010271100000',
      '26448915403000010021000000',
      '2644891540100001040000TX2',
      '26448915401000010390000000',
      '26448915401000010411000000',
      '2644891540100001040000TX1',
      '26448915401000010412000000',
      '26448915401000010260000000',
      '26448915401000011070000000',
      '26448915401000011060000000',
      '26448915403000040580000000',
      '26448915413000010980000000',
      '26448915413000010990000000',
    ],
  },
  /**
   * Two town Wetlands parcels whose deed description reads "Mason Valley"
   * (15.73 + 23.56 ac) sum to 39.29 ac, the town Park Plan's 39.3 ac. The old
   * point sat on the Creekstone apartment complex (100 Ranney Dr), so it moves
   * into the woods of the west parcel.
   */
  '/town-parks/perinton-parks/mason-valley/': {
    layer: 'county parcels',
    ids: ['26448916620000020530000000', '26448916717000020011000000'],
  },
  /**
   * Three tax-exempt wooded parcels (15.35 + 13.55 + 11.58 ac) match the
   * outline on the town's McCoord Woods sheet: the main block, the neck north
   * to Little Spring Run and the tail to the southeast. Together they are 40.5
   * ac; the town's figure of 29.2 ac is smaller than the land its own map
   * draws (ADR-0003).
   */
  '/town-parks/perinton-parks/mccoord-hannan-woods/': {
    layer: 'county parcels',
    ids: [
      '26448917907000020112000000',
      '26448917907000020111000000',
      '26448917911000010604000000',
    ],
  },
  /**
   * 99 O'Connor Rd (11 ac, Municipal Park) is all of the town-owned part of
   * the area the town's Perinton Park sheet outlines. The canal-side part is
   * leased from the State Canal Corporation and has no tax parcel. The sheet's
   * 43.6 ac must count other land that its map does not draw (ADR-0003).
   */
  '/town-parks/perinton-parks/perinton-park/': {
    layer: 'county parcels',
    ids: ['26448915215000020100000000'],
  },
  /**
   * 56.7 of 68 ac, on Thayer Rd.
   */
  '/town-parks/perinton-parks/thayer-hill/': {
    layer: 'county parcels',
    ids: ['26448918002000010680000000'],
  },
  /**
   * 22 North Main St, the page's address, is a 0.44 ac Municipal Park parcel
   * on the canal bank. The rest of the page's 2 ac is canal land with no tax
   * parcel. The old point was on the North Main St bridge, so it moves onto
   * the park.
   */
  '/town-parks/pittsford-parks/carpenter-park-port-pittsford/': {
    layer: 'county parcels',
    ids: ['26460115118000030300000000'],
  },
  /**
   * The town's Daffodil Meadow map puts it south of Thornell Rd on the east
   * side of Irondequoit Creek. The point is on the tax-exempt 26.3 ac wooded
   * creek parcel there, which is the only public parcel between Thornell Rd
   * and Park Rd.
   */
  '/town-parks/pittsford-parks/daffodil-meadow/': {
    layer: 'county parcels',
    ids: ['26468917816000020670000000'],
  },
  /**
   * Five town Municipal Park parcels (4.99 + 7.27 + 0.21 + 4.7 + 1.1 ac) cover
   * the woods and ponds of the town's Frog Pond Trail map, from the Auburn
   * Trail down to the canal: 18.3 of the page's 20 ac. The trail also crosses
   * a private 2.3 ac lot (Vacant comm), which is left out.
   */
  '/town-parks/pittsford-parks/erie-canal-nature-preserve/': {
    layer: 'county parcels',
    ids: [
      '26468915117000020182000000',
      '26460115118000010552000000',
      '26468915117000020183000000',
      '26460115118000010520000000',
      '26468915117000020210000000',
    ],
  },
  /**
   * 34 East St (25.76 ac, Rec facility) holds the three ball fields, their
   * parking, the dog park and the woods behind them. The fields are its main
   * use, so this Park gets the parcel; the page's 6 ac counts only the fields
   * (ADR-0003).
   */
  '/town-parks/pittsford-parks/habecker-fields/': {
    layer: 'county parcels',
    ids: ['26468916404000010100000000'],
  },
  /**
   * The only town parcel here is the 3.8 ac Municipal Park strip of old canal
   * bed north of the lock. The lock and the wooded trail south of it are on
   * land with no tax parcel. The page's 15 ac is the acreage of the Wegmans
   * parcel at 3195 Monroe Ave, not of the Park.
   */
  '/town-parks/pittsford-parks/lock-62-canal-park/': {
    layer: 'county parcels',
    ids: ['26468915012000010340000000'],
  },
  /**
   * A tax-exempt 89.96 ac parcel off West Bloomfield Rd, north of the Thruway,
   * has the page's acres exactly and the fields and paths of the town's Royal
   * Coach Trails map. The old point was on West Bloomfield Rd 700 m to the
   * northeast, so it moves into the field.
   */
  '/town-parks/pittsford-parks/royal-coach-park/': {
    layer: 'county parcels',
    ids: ['26468919201000010272000000'],
  },
  /**
   * The current parcel is right, but it is only part of the Park. It is the
   * 1.1 ac Municipal Park parcel on the north bank of Honeoye Creek at the
   * falls. The memorial and gazebo on the south bank are at the tip of an 83.8
   * ac greenway parcel, which cannot be added. This explains 1.1 of the page's
   * 2.30 ac.
   */
  '/town-parks/rush-parks/veterans-memorial-park/': {
    layer: 'county parcels',
    ids: ['26500021311000010740000000'],
  },
  /**
   * Address and acres match (215.7 of 215 ac).
   */
  '/town-parks/rush-parks/white-springs-farm/': {
    layer: 'county parcels',
    ids: ['26500020103000010320000000'],
  },
  /**
   * The 1.5-acre class-591 Playground parcel between Barry and Lyman streets
   * matches the village's 1.5 acres and shows the courts and playground. The
   * old point was on a house lot about 110 m east.
   */
  '/town-parks/sweden-parks/barry-street-park/': {
    layer: 'county parcels',
    ids: ['26520106909000040090000000'],
  },
  /**
   * The 0.32-acre class-591 Playground parcel between 207 and 215 Evergreen
   * Road (so 211, the village's address) backs onto the canal and matches the
   * village's three-tenths of an acre. The old point was on a house four lots
   * west.
   */
  '/town-parks/sweden-parks/evergreen-tot-lot/': {
    layer: 'county parcels',
    ids: ['26520106811000060160000000'],
  },
  /**
   * 760 Herman Rd (28.7 ac, Municipal Park, described as "Herman Rd Forever
   * Wild Forest", town resolution 295-2023) is the Park at its page address
   * and acres. Whiting Road Nature Preserve's current outline also holds this
   * parcel and must drop it.
   */
  '/town-parks/webster-parks/herman-road-forever-wild-forest/': {
    layer: 'county parcels',
    ids: ['26548906401000010170000000'],
  },
  /**
   * Address matches (1002 vs 1000 Ridge Rd), 36.8 of 40.8 ac.
   */
  '/town-parks/webster-parks/ridge-park/': {
    layer: 'county parcels',
    ids: ['26548907911000010101000000'],
  },
  /**
   * 302 Lake Rd (1.57 ac, described as "Sandbar Park") is the lawn on the lake
   * side. The old railroad strip (4.27 + 0.05 ac) holds the pavilion and the
   * lake-side parking, and 279 Lake Rd (2.7 ac, town Municipal Park) is the
   * bay-side lot with the kayak dock the page names. All four are town park-
   * class land (8.6 ac). The railroad strip also runs west along the shore
   * behind the houses.
   */
  '/town-parks/webster-parks/sandbar-park/': {
    layer: 'county parcels',
    ids: [
      '26548906309000010321000000',
      '2654890630900001078130000',
      '26548906309000010781210000',
      '26548906309000010370000000',
    ],
  },
  /**
   * The script's own parcels, less 26548906401000010170000000 (760 Herman Rd):
   * its deed names the Herman Road Forever Wild Forest, which is a Park of its
   * own.
   */
  '/town-parks/webster-parks/whiting-road-nature-preserve/': {
    layer: 'county parcels',
    ids: [
      '26548904903000010120000000',
      '26548904903000010230000000',
      '26548904903000010240000000',
      '26548906401000010451000000',
    ],
  },
  /**
   * The point is on the tax-exempt 0.26-acre government parcel on River Rd
   * (Route 251) that holds the picnic lawn and parking by Oatka Creek. The
   * 16.72-acre class-590 parcel in the old outline is the old Pennsylvania
   * Railroad corridor, which runs over a kilometre north-east as a trail, so
   * it is dropped; the lawn east of the parking is on that corridor.
   */
  '/town-parks/wheatland-parks/canawaugus-park/': {
    layer: 'county parcels',
    ids: ['26560120010000010071000000'],
  },
  /**
   * Acres match exactly (4.60 ac).
   */
  '/town-parks/wheatland-parks/freeman-park/': {
    layer: 'county parcels',
    ids: ['26568920816000010260000000'],
  },
  /**
   * The tax-exempt 3.86-acre government parcel at 3 Browns Ave (the town gives
   * 5 Browns Ave) holds the pavilion, rink, volleyball courts and playground.
   * The 2.70-acre open field beside it matches the page's 2.72 acres but is
   * classed School (612), so ADR-0005 keeps it out unless the village's
   * ownership is confirmed. The old point was on the line between them.
   */
  '/town-parks/wheatland-parks/johnson-park/': {
    layer: 'county parcels',
    ids: ['26560120005000030550000000'],
  },
};

/** Parks with no outline by decision, and why (#292). Key: the page's URL. */
export const NO_OUTLINE: Record<string, string> = {
  '/rochester-city-parks/jefferson-terrace-park/':
    'The lawn and play area wrap around the School #4 building on the school parcel, which ADR-0005 excludes. Only two small City lots at the edges are not school land, and they do not draw the Park, so the page keeps its point with no outline.',
  '/rochester-city-parks/field-st-park/':
    'The field is the north half of the School #35 parcel (194 Field St, class 612 School, 3.74 ac); no separate parcel holds it, and ADR-0005 excludes school land.',
  '/rochester-city-parks/grape-and-wilder/':
    'The basketball court and green sit on land that no tax parcel covers, between Wilder St, the I-490 ramps and the railroad; the only parcel there is a 0.006 ac sliver.',
  '/rochester-city-parks/roc-city-skatepark/':
    'The skatepark is inside the ramp loop of the Frederick Douglass-Susan B. Anthony Bridge, on highway land that no tax parcel covers.',
  '/rochester-city-parks/st-johns-park/':
    'The 0.2 ac green is the south tip of the Charlotte fire station parcel (4050 Lake Ave, class 662 Police/Fire, 1.08 ac), a triangle between Lake Ave and River St; no parcel holds the park alone.',
  '/state-parks/high-falls-state-park/':
    "The park is planned, not open. The state's framework plan puts about 40 ac on both sides of the gorge across many City, utility and private parcels, and no official boundary exists yet.",
  '/town-parks/greece-parks/goodwin-park/':
    "The playground, paths and parking lot sit on the strip between Long Pond Road and the canal to Lake Ontario, and that strip is in no tax parcel. The address, 15 Long Pond Road, is the fire station's parcel across the road.",
  '/town-parks/mendon-parks/big-eddy-park/':
    'Big Eddy is a wide pool of Honeoye Creek inside Rotary Park ("the Big Eddy in Honeoye Creek in Rotary Park"), not a Park of its own: the village lists four parks and no Big Eddy, and the point is on a private taxable house lot at 57 Maplewood Ave. The page is a second page for Rotary Park\'s land (ADR-0007); the nearby 17.2-acre class-963 parcel is Clover Meadows subdivision open space, not this place.',
  '/town-parks/ogden-parks/ogden-memorial-park/':
    "The point is on the grass triangle where Union Street meets Brockport Road, and that triangle is in no tax parcel. No park-type parcel is within 450 m, and Ogden's 2024 plan says only that the village owns it. A road triangle may also fail ADR-0005.",
  '/town-parks/perinton-parks/bushnells-basin-docks/':
    'The docks, restrooms and parking are a strip of canal-bank land with no tax parcel. The parcels next to it are private shops on Pittsford-Victor Rd.',
  '/town-parks/pittsford-parks/copper-beech-park/':
    'The 0.23 ac park is a corner of 14 State St, a 1.08 ac town parcel that is mostly the public parking lot behind State St. The 10 North Main St section has no parcel of its own. No parcel set draws the park without the parking lot.',
  '/town-parks/pittsford-parks/great-embankment-park/':
    'The ball fields, playground and parking between the canal and Marsh Rd are on canal land with no tax parcel.',
  '/town-parks/pittsford-parks/pittsford-town-dog-park/':
    'The dog park is a fenced 2-acre area inside the 25.76 ac parcel at 34 East St that is drawn as Habecker Fields. It has no parcel of its own.',
  '/town-parks/sweden-parks/harvester-park/':
    'Harvester Park and the Welcome Center at 11 Water St sit on the south canal bank inside the 93.7-acre state Barge Canal parcel; the park has no tax parcel of its own. The old point was on a Main St shop; it now sits on the canal bank by the Welcome Center.',
  '/town-parks/sweden-parks/remembrance-park/':
    'The small tree-covered triangle on Park Avenue between High and Spring streets has no tax parcel: it is street land in the county layer, so no outline can be drawn.',
};
