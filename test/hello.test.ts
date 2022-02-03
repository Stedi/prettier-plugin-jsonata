import * as hello from "../index"

describe("my lib", () => {
  test("greet", () => {
    expect(hello.greet("dude")).toEqual("Hello dude!")
  })
})
