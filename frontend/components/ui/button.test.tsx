import { render, screen } from "@testing-library/react"

import { Button } from "@/components/ui/button"

describe("Button", () => {
  it("renders children and default classes", () => {
    render(<Button>Guardar</Button>)

    const button = screen.getByRole("button", { name: "Guardar" })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass("bg-primary")
  })

  it("applies variant, size and custom className", () => {
    render(
      <Button variant="destructive" size="sm" className="my-custom-class">
        Eliminar
      </Button>
    )

    const button = screen.getByRole("button", { name: "Eliminar" })
    expect(button).toHaveClass("my-custom-class")
    expect(button).toHaveClass("bg-destructive/10")
    expect(button).toHaveClass("h-7")
  })
})
