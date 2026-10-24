import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing(
  "inductor with an unparseable inductance reports an invalid property error",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="20mm" height="10mm" routingDisabled>
        <inductor name="L1" inductance="not-an-inductance" footprint="0603" />
        <inductor name="L2" inductance="10uH" footprint="0603" pcbX={5} />
      </board>,
    )

    await circuit.renderUntilSettled()

    const circuitJson = circuit.getCircuitJson()

    const invalidPropertyErrors = circuitJson.filter(
      (element) => element.type === "source_invalid_component_property_error",
    )
    const invalidInductor = circuit.db.source_component.getWhere({ name: "L1" })

    // Only L1 is reported; the valid L2 produces no error.
    expect(invalidPropertyErrors).toHaveLength(1)
    expect(invalidPropertyErrors[0]).toMatchObject({
      source_component_id: invalidInductor?.source_component_id,
      property_name: "inductance",
      property_value: "not-an-inductance",
    })
    expect(invalidPropertyErrors[0].message).toContain('inductor "L1"')
    expect(invalidPropertyErrors[0].message).toContain('"not-an-inductance"')
  },
)
