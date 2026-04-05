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
import { Ruler, Info, Footprints } from 'lucide-react';

export const metadata = {
  title: 'Size Guide | Executive Mochi',
  description: 'Find your perfect fit with our comprehensive shoe size guide',
};

const mensSizes = [
  { pk: '6', uk: '6', us: '7', eu: '39', cm: '24.5' },
  { pk: '7', uk: '7', us: '8', eu: '40', cm: '25.4' },
  { pk: '8', uk: '8', us: '9', eu: '41', cm: '26.2' },
  { pk: '9', uk: '9', us: '10', eu: '42', cm: '27.1' },
  { pk: '10', uk: '10', us: '11', eu: '43', cm: '27.9' },
  { pk: '11', uk: '11', us: '12', eu: '44', cm: '28.8' },
  { pk: '12', uk: '12', us: '13', eu: '45', cm: '29.6' },
];

const widthGuide = [
  { width: 'Narrow', description: 'For feet that are slimmer than average', best: 'Formal shoes, Oxfords' },
  { width: 'Standard', description: 'For feet of average width', best: 'Most shoe styles' },
  { width: 'Wide', description: 'For feet that are wider than average', best: 'Loafers, Casual shoes, Boots' },
];

export default function SizeGuidePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-secondary/30 py-12">
        <div className="container mx-auto px-4 text-center">
          <Ruler className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="font-serif text-4xl font-bold tracking-tight mb-4">Size Guide</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Find your perfect fit with our comprehensive size guide. All Executive Mochi shoes 
            are crafted to standard Pakistani/UK sizing.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* How to Measure */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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
            <div className="mt-4 p-4 bg-primary/5 rounded-lg">
              <p className="text-sm flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 text-primary" />
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
            <CardTitle>Size Conversion Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="mens" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="mens">Men&apos;s Sizes</TabsTrigger>
                <TabsTrigger value="traditional">Traditional (Khussas)</TabsTrigger>
              </TabsList>
              
              <TabsContent value="mens">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">PK/UK</TableHead>
                        <TableHead>US</TableHead>
                        <TableHead>EU</TableHead>
                        <TableHead>Foot Length (cm)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mensSizes.map((size) => (
                        <TableRow key={size.pk}>
                          <TableCell className="font-medium">{size.pk}</TableCell>
                          <TableCell>{size.us}</TableCell>
                          <TableCell>{size.eu}</TableCell>
                          <TableCell>{size.cm}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="traditional">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Khussa Size</TableHead>
                        <TableHead>PK/UK Equivalent</TableHead>
                        <TableHead>Foot Length (cm)</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Small</TableCell>
                        <TableCell>6-7</TableCell>
                        <TableCell>24.5 - 25.4</TableCell>
                        <TableCell>Slightly snug fit recommended</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Medium</TableCell>
                        <TableCell>8-9</TableCell>
                        <TableCell>26.2 - 27.1</TableCell>
                        <TableCell>Most popular size</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Large</TableCell>
                        <TableCell>10-11</TableCell>
                        <TableCell>27.9 - 28.8</TableCell>
                        <TableCell>Leather stretches with wear</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">X-Large</TableCell>
                        <TableCell>12</TableCell>
                        <TableCell>29.6+</TableCell>
                        <TableCell>Made to order available</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Traditional khussas are designed to mold to your feet over time. 
                  We recommend choosing a snug fit as the leather will stretch and conform to your foot shape.
                </p>
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
                <h4 className="font-semibold mb-2">Boots (Chelsea, Chukka)</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Consider half size up for thick socks</li>
                  <li>Ankle should feel secure but not tight</li>
                  <li>Allow room for feet to swell during day</li>
                  <li>Break-in period of 2-3 wears is normal</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Khussas (Traditional)</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Choose snug fit - leather stretches</li>
                  <li>Initial tightness is normal</li>
                  <li>Will mold to foot shape over time</li>
                  <li>Wear with thin or no socks traditionally</li>
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
