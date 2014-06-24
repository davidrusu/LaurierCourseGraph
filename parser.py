#! /usr/bin/env python3

from bs4 import BeautifulSoup
import bs4
import itertools as it
import sys


def still_going(tag):
    if type(tag) is bs4.element.NavigableString:
        return True
    try:
        if 'This layout table is used to present the sections found' in tag['summary']:
            return False
    except KeyError:
        return True
    return True


def get_prereq(tag):
    prereq = []
    while still_going(tag.next_sibling):
        tag = tag.next_sibling
        if tag.name == 'a' and tag.string != ' ':
            prereq.append(tag.string)
    return prereq

    
def main(file_name):
    soup = BeautifulSoup(open(file_name))
    body = soup.body
    course_div = body.find_all(attrs={'class':'pagebodydiv'})[0]
    courses = course_div.find_all(
        attrs={'summary':
               'This layout table is used to present the sections found'})
    nodes = []
    for course in courses[:-1]:
        values = course.tbody.tr.th.string.strip().split(' - ')
        if len(values) == 5:
            values = [values[0] + ' - ' + values[1]] + values [2:]
        name = values[0]
        course_id = values[1]
        course_code = values[2]
        course_section = values[3]
        while still_going(course.next_sibling):
            course = course.next_sibling
            if course.string and 'Prerequisites:' in course.string:
                break
        prereq = tuple()
        if course.string and 'Prerequisites: ' in course.string:
            prereq = tuple(sorted(get_prereq(course)))
            #print('prereq', prereq)
        nodes.append((course_code, prereq))
    
    out_file = open('dependencies.dot', 'w')
    print('digraph G {', file=out_file)
    for code, dependencies in set(nodes):
        node_name = code.strip().replace(' ', '_')
        deps = set([str(dep.strip().replace(' ', '_')) for dep in dependencies])
        
        if node_name == 'BU_383':
            print(dependencies)
        
        for dep in deps:
            child_name = dep
            print('    {} -> {};'.format(node_name, child_name), file=out_file)
    print('}', file=out_file)

if __name__ == '__main__':
    main(sys.argv[1])
