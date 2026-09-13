import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Ruler, Info, Footprints, Baby, UserCheck, Sparkles } from 'lucide-react';
import {
  menSizesUK,
  menSizesEU,
  womenSizesUK,
  womenSizesEU,
  kidsSubGroups,
} from '@/lib/utils/catalog';

export const metadata: Metadata = {
  title: 'Footwear Size Guide (UK / EU / CM)',
  description:
    'Find your perfect shoe fit with our official Executive Mochi shoe size conversion chart for Men, Women, and Kids. Detailed width measurements and measuring guide.',
  alternates: {
    canonical: 'https://executivemochi.pk/size-guide',
  },
  openGraph: {
    title: 'Executive Mochi Size Guide | Men, Women & Kids',
    description: 'UK, US, EU, and CM footwear size conversion charts with foot measurement instructions.',
    url: 'https://executivemochi.pk/size-guide',
  },
};

const widthGuide = [
  { width: 'Narrow', description: 'For feet that are slimmer than average', best: 'Formal shoes, Oxfords' },
  { width: 'Standard', description: 'For feet of average width', best: 'Most shoe styles' },
  { width: 'Wide', description: 'For feet that are wider than average', best: 'Loafers, Casual shoes, Boots' },
];

export default function SizeGuidePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-stone-950 text-white py-12 border-b border-border/40">
        <div className="container mx-auto px-4 text-center">
          <Ruler className="h-12 w-12 mx-auto mb-4 text-amber-400" />
          <h1 className="font-serif text-4xl font-bold tracking-tight mb-4">Official Size Guide</h1>
          <p className="text-stone-300 max-w-xl mx-auto">
            Find your perfect fit across Men, Women, and Kids collections. All Executive Mochi shoes 
            are crafted to exact Pakistani/UK &amp; English (EU) sizing.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* How to Measure */}
        <Card className="mb-8 border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Footprints className="h-5 w-5" />
              How to Measure Your Feet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Prepare:</span> Place a piece of paper on a hard floor against a wall. Have a pencil and ruler ready.
              </li>
              <li>
                <span className="font-medium text-foreground">Stand:</span> Stand on the paper with your heel against the wall. Keep your weight evenly distributed.
              </li>
              <li>
                <span className="font-medium text-foreground">Mark:</span> Mark the longest point of your foot (usually the big toe or second toe) on the paper.
              </li>
              <li>
                <span className="font-medium text-foreground">Measure:</span> Use a ruler to measure from the edge of the paper to the mark in centimeters.
              </li>
              <li>
                <span className="font-medium text-foreground">Compare:</span> Use the measurement to find your size in the chart below.
              </li>
            </ol>
            <div className="mt-4 p-4 bg-secondary/60 rounded-lg border border-border">
              <p className="text-sm flex items-start gap-2 text-foreground">
                <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span>
                  <strong>Tip:</strong> Measure your feet in the evening when they&apos;re at their largest. 
                  If one foot is larger than the other, use the larger measurement.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Size Charts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Size Conversion Charts</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="kids" className="w-full">
              <TabsList className="mb-6 flex flex-wrap h-auto gap-2 bg-secondary/50 p-1.5 rounded-xl">
                <TabsTrigger value="kids" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
                  Kids Collection (By Age Group)
                </TabsTrigger>
                <TabsTrigger value="mens" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
                  Men&apos;s Collection
                </TabsTrigger>
                <TabsTrigger value="womens" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
                  Female / Women&apos;s Collection
                </TabsTrigger>
                <TabsTrigger value="traditional" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
                  Traditional (Khussas)
                </TabsTrigger>
              </TabsList>
              
              {/* Kids Collection */}
              <TabsContent value="kids">
                <div className="space-y-8">
                  {/* Youth (11-15 yrs) */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-semibold text-lg text-primary">
                        1. Youth Collection
                      </span>
                      <span className="bg-amber-100 text-amber-900 text-xs font-semibold px-2 py-0.5 rounded-full">
                        Age Group: 11–15 yrs
                      </span>
                    </div>
                    <div className="overflow-x-auto border rounded-xl">
                      <Table>
                        <TableHeader className="bg-muted/60">
                          <TableRow>
                            <TableHead className="font-bold text-foreground">UK / PK Size</TableHead>
                            <TableHead className="font-bold text-foreground">Youth English / EU Size</TableHead>
                            <TableHead>Target Age Group</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {kidsSubGroups.youth.uk.map((uk, idx) => (
                            <TableRow key={uk}>
                              <TableCell className="font-bold text-primary">{uk}</TableCell>
                              <TableCell className="font-semibold">{kidsSubGroups.youth.eu[idx]}</TableCell>
                              <TableCell className="text-muted-foreground">{kidsSubGroups.youth.ageGroup}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Girls (7-11 yrs) */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-semibold text-lg text-primary">
                        2. Girls Collection
                      </span>
                      <span className="bg-pink-100 text-pink-900 text-xs font-semibold px-2 py-0.5 rounded-full">
                        Age Group: 7–11 yrs
                      </span>
                    </div>
                    <div className="overflow-x-auto border rounded-xl">
                      <Table>
                        <TableHeader className="bg-muted/60">
                          <TableRow>
                            <TableHead className="font-bold text-foreground">UK / PK Size</TableHead>
                            <TableHead className="font-bold text-foreground">Girls English / EU Size</TableHead>
                            <TableHead>Target Age Group</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {kidsSubGroups.girls.uk.map((uk, idx) => (
                            <TableRow key={uk}>
                              <TableCell className="font-bold text-primary">{uk}</TableCell>
                              <TableCell className="font-semibold">{kidsSubGroups.girls.eu[idx]}</TableCell>
                              <TableCell className="text-muted-foreground">{kidsSubGroups.girls.ageGroup}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Boys (7-11 yrs) */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-semibold text-lg text-primary">
                        3. Boys Collection
                      </span>
                      <span className="bg-blue-100 text-blue-900 text-xs font-semibold px-2 py-0.5 rounded-full">
                        Age Group: 7–11 yrs
                      </span>
                    </div>
                    <div className="overflow-x-auto border rounded-xl">
                      <Table>
                        <TableHeader className="bg-muted/60">
                          <TableRow>
                            <TableHead className="font-bold text-foreground">UK / PK Size</TableHead>
                            <TableHead className="font-bold text-foreground">Boys English / EU Size</TableHead>
                            <TableHead>Target Age Group</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {kidsSubGroups.boys.eu.map((eu, idx) => (
                            <TableRow key={eu}>
                              <TableCell className="font-bold text-primary">{kidsSubGroups.boys.uk[idx] ?? (idx === 6 ? '2' : '-')}</TableCell>
                              <TableCell className="font-semibold">{eu}</TableCell>
                              <TableCell className="text-muted-foreground">{kidsSubGroups.boys.ageGroup}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Children (2-6 yrs) */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-semibold text-lg text-primary">
                        4. Children Collection
                      </span>
                      <span className="bg-emerald-100 text-emerald-900 text-xs font-semibold px-2 py-0.5 rounded-full">
                        Age Group: 2–6 yrs
                      </span>
                    </div>
                    <div className="overflow-x-auto border rounded-xl">
                      <Table>
                        <TableHeader className="bg-muted/60">
                          <TableRow>
                            <TableHead className="font-bold text-foreground">UK / PK Size</TableHead>
                            <TableHead className="font-bold text-foreground">English / EU Size</TableHead>
                            <TableHead>Target Age Group</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {kidsSubGroups.children.uk.map((uk, idx) => (
                            <TableRow key={uk}>
                              <TableCell className="font-bold text-primary">{uk}</TableCell>
                              <TableCell className="font-semibold">{kidsSubGroups.children.eu[idx]}</TableCell>
                              <TableCell className="text-muted-foreground">{kidsSubGroups.children.ageGroup}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Men's Collection */}
              <TabsContent value="mens">
                <div className="overflow-x-auto border rounded-xl">
                  <Table>
                    <TableHeader className="bg-muted/60">
                      <TableRow>
                        <TableHead className="font-bold text-foreground">UK / PK Size</TableHead>
                        <TableHead className="font-bold text-foreground">English / EU Size</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {menSizesUK.map((uk, idx) => (
                        <TableRow key={uk}>
                          <TableCell className="font-bold text-primary">{uk}</TableCell>
                          <TableCell className="font-semibold">{menSizesEU[idx]}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Female / Women's Collection */}
              <TabsContent value="womens">
                <div className="overflow-x-auto border rounded-xl">
                  <Table>
                    <TableHeader className="bg-muted/60">
                      <TableRow>
                        <TableHead className="font-bold text-foreground">UK / PK Size</TableHead>
                        <TableHead className="font-bold text-foreground">English / EU Size</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {womenSizesUK.map((uk, idx) => (
                        <TableRow key={uk}>
                          <TableCell className="font-bold text-primary">{uk}</TableCell>
                          <TableCell className="font-semibold">{womenSizesEU[idx]}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Traditional (Khussas) */}
              <TabsContent value="traditional">
                <div className="overflow-x-auto border rounded-xl">
                  <Table>
                    <TableHeader className="bg-muted/60">
                      <TableRow>
                        <TableHead className="font-semibold">Khussa Size</TableHead>
                        <TableHead>PK/UK Equivalent</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Small</TableCell>
                        <TableCell>6 - 7</TableCell>
                        <TableCell>Slightly snug fit recommended</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Medium</TableCell>
                        <TableCell>8 - 9</TableCell>
                        <TableCell>Most popular size</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Large</TableCell>
                        <TableCell>10 - 11</TableCell>
                        <TableCell>Leather stretches with wear</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">X-Large</TableCell>
                        <TableCell>12 - 13</TableCell>
                        <TableCell>Made to order available</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Width Guide */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Width Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Width</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Best For</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {widthGuide.map((width) => (
                    <TableRow key={width.width}>
                      <TableCell className="font-medium">{width.width}</TableCell>
                      <TableCell>{width.description}</TableCell>
                      <TableCell>{width.best}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Style-Specific Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Style-Specific Fitting Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Formal Shoes (Oxford, Derby)</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Should fit snugly but not tight</li>
                  <li>Allow for dress socks (slightly thinner)</li>
                  <li>Heel should not slip when walking</li>
                  <li>Leather will stretch slightly with wear</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Casual Shoes (Loafers)</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Should feel comfortable immediately</li>
                  <li>No heel slippage</li>
                  <li>Toes should not touch the front</li>
                  <li>Consider wide fit for all-day comfort</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Kids &amp; School Shoes</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Choose exact age group chart for Youth, Girls, Boys, or Children</li>
                  <li>Leave a thumb-width of room for growing feet</li>
                  <li>Non-slip soles are standard across all kids articles</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Khussas (Traditional)</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Choose snug fit - leather stretches</li>
                  <li>Initial tightness is normal</li>
                  <li>Will mold to foot shape over time</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">
            Still unsure about your size? Our team is here to help!
          </p>
          <p className="text-sm text-muted-foreground">
            Contact us at{' '}
            <a href="tel:+923001234567" className="text-primary hover:underline">+92 300 1234567</a>
            {' '}or{' '}
            <a href="mailto:help@executivemochi.pk" className="text-primary hover:underline">help@executivemochi.pk</a>
          </p>
        </div>
      </div>
    </div>
  );
}
