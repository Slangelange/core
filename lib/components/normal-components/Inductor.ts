import { inductorProps, resolveManufacturerPartNumber } from "@tscircuit/props"
import {
  FTYPE,
  type BaseSymbolName,
  type PassivePorts,
} from "lib/utils/constants"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { Port } from "../primitive-components/Port"
import { formatSiUnit, parseAndConvertSiUnit } from "format-si-unit"
import type { SourceSimpleInductor } from "circuit-json"

export class Inductor extends NormalComponent<
  typeof inductorProps,
  PassivePorts
> {
  _adjustSilkscreenTextAutomatically = true

  get config() {
    return {
      componentName: "Inductor",
      schematicSymbolName: (this.props.symbolName ??
        ("inductor" as BaseSymbolName)) as BaseSymbolName,
      zodProps: inductorProps,
      sourceFtype: FTYPE.simple_inductor,
    }
  }

  _getSchematicSymbolDisplayValue(): string | undefined {
    return `${formatSiUnit(this._parsedProps.inductance)}H`
  }

  initPorts() {
    super.initPorts({
      additionalAliases: {
        pin1: ["anode", "pos", "left"],
        pin2: ["cathode", "neg", "right"],
      },
    })
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      name: this.name,
      ftype: FTYPE.simple_inductor,
      inductance: this.props.inductance,
      max_current_rating:
        props.maxCurrentRating === undefined
          ? undefined
          : parseAndConvertSiUnit(props.maxCurrentRating, "A").value,
      display_inductance: this._getSchematicSymbolDisplayValue(),
      supplier_part_numbers: props.supplierPartNumbers,
      manufacturer_part_number: resolveManufacturerPartNumber(props),
      are_pins_interchangeable: true,
      display_name: props.displayName,
    } as Omit<SourceSimpleInductor, "source_component_id" | "type">)
    this.source_component_id = source_component.source_component_id

    // An unparseable inductance string (e.g. "not-an-inductance") passes the
    // props schema as NaN, so report it instead of silently emitting NaN.
    if (!Number.isFinite(props.inductance)) {
      db.source_invalid_component_property_error.insert({
        source_component_id: source_component.source_component_id,
        property_name: "inductance",
        property_value: this.props.inductance,
        expected_format: 'a number of henries or an SI string such as "10uH"',
        message: `Invalid inductance prop on ${this.getDisplayName()}: "${this.props.inductance}". Expected a number of henries or a string with an SI unit, e.g. "10uH" or "100nH"`,
        error_type: "source_invalid_component_property_error",
      })
    }
  }
}
