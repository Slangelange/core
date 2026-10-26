import { test, expect } from "bun:test"
import type { PcbSmtPadRect } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("yDist edgeToEdge constraint separates pads by the requested gap", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="1mm"
              height="2mm"
              portHints={["pin1"]}
            />
            <smtpad
              shape="rect"
              width="1mm"
              height="4mm"
              portHints={["pin2"]}
            />
            <constraint
              pcb
              edgeToEdge
              yDist="1mm"
              top=".pin1"
              bottom=".pin2"
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const smtpads = circuit.db.pcb_smtpad.list() as PcbSmtPadRect[]
  const topPad = smtpads.find((p) => p.height === 2)!
  const bottomPad = smtpads.find((p) => p.height === 4)!

  // Centers should be 4mm apart: 1mm gap + 1mm top half-height + 2mm bottom
  // half-height. The previous implementation added the top half-height
  // instead of subtracting it, producing a 2mm separation (a 1mm overlap).
  expect(Math.abs(topPad.y - bottomPad.y)).toBeCloseTo(4, 1)
})
