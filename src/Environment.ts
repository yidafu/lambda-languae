class Environment {
  varialbles: Map<string, any>;

  parent: Environment | null;

  /**
   * TODO: 基于链表实现
   * @param parent 
   */
  constructor(parent: Environment | null = null) {
    this.varialbles = new Map<string, any>();
    this.parent = parent;
  }

  extend() {
    return new Environment(this);
  }

  lookup(name: string) {
    let scope: Environment | null = this;
    while (scope) {
      if (scope.varialbles.has(name)) {
        // NOTE: return scope
        return scope;
      }
      scope = scope.parent;
    }
  }

  get(name: string) {
    if (this.varialbles.has(name)) {
      return this.varialbles.get(name);
    }
    throw new Error('Undefined variable ' + name)
  }

  set(name: string, val: any) {
    const scope = this.lookup(name);
    if (!scope && this.parent) { // 排除全局全局
      throw new Error('Undefined variable ' + name);
    }
    return (scope || this).varialbles.set(name, val);
  }

  def(name: string, val: any) {
    this.varialbles.set(name, val);
  }
}

export { Environment }