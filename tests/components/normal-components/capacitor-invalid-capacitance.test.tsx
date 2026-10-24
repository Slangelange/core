import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing(
  "capacitor with an unparseable capacitance reports an invalid property error",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="20mm" height="10mm" routingDisabled>
        <capacitor name="C1" capacitance="not-a-capacitance" footprint="0402" />
        <capacitor name="C2" capacitance="10uF" footprint="0402" pcbX={5} />
      </board>,
    )

    await circuit.renderUntilSettled()

    const circuitJson = circuit.getCircuitJson()

    const invalidPropertyErrors = circuitJson.filter(
      (element) => element.type === "source_invalid_component_property_error",
    )
    const invalidCapacitor = circuit.db.source_component.getWhere({
      name: "C1",
    })

    // Only C1 is reported; the valid C2 produces no error.
    expect(invalidPropertyErrors).toHaveLength(1)
    expect(invalidPropertyErrors[0]).toMatchObject({
      source_component_id: invalidCapacitor?.source_component_id,
      property_name: "capacitance",
      property_value: "not-a-capacitance",
    })
    expect(invalidPropertyErrors[0].message).toContain('capacitor "C1"')
    expect(invalidPropertyErrors[0].message).toContain('"not-a-capacitance"')
  },
)
